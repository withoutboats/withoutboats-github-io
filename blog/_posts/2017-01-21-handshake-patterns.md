---
layout: post
title: Handshake Patterns
categories: rust patterns traits
---

## The problem: defining a 'handshake' protocol between two traits

**You have a problem that decomposes in this way: you want any type which implements trait `Alpha` to be composable with any type which implements trait `Omega`...**

That is, if Foo and Bar are both `Alpha`s and Baz and Quux are both `Omega`s, you can compose Foo with Baz or Quux, and the same with Bar, and so on.

This is not a trivial problem. In particular, we have already constrained ourselves by requiring that `Alpha` and `Omega` both be _traits_. This requirement implies that both sides of the 'handshake' we are implementing are open sets of types, and that new authors will be able to extend our system by defining new `Alpha`s and new `Omega`s. In fact, an `Alpha` can be written by one another, an `Omega` by another, and though neither author was aware of one another, a third author can compose their two types together.

To make this pattern more concrete, we'll look at one use case: serialization. It would be ideal for any serializable type be serializable by any serializer, and for any serializer to be able to serialize any serializable type. We'll look at the trade offs for different ways of implementing `Serialize` and `Serializer`, starting with the definition currently in `serde`.

## Static handshake

**..you include a type parameter in the methods on both traits.**

{% highlight rust %}
trait Serialize {
    fn serialize<S>(&self, serializer: &mut S) -> Result<(), S::Error>
    where S: Serializer;
}

trait Serializer {
    //...
    fn serialize_map_value<S>(&mut self, state: &mut Self::MapState, value: &S)
        -> Result<(), Self::Error>
    where S: Serialize;

    fn serialize_seq_elt<S>(&mut self, state: &mut Self::SeqState, elt: &S)
        -> Result<(), Self::Error>;
    where S: Serialize;
    //...
}
{% endhighlight %}

This is definition of serialization that is used by serde. `Serialize::serialize` is generic over any `Serializer` type, and `Serializer` has methods which are generic over any `Serialize` type.

The main advantage of this definition is that it is statically dispatched: the compiler will generate a unique function for each serialization method you call, which can be transparently optimized by the optimizer in LLVM - allowing serialization to be as fast as a handwritten implementation for a specific serializer, despite only being written once for *all* serializers.

The main disadvantage of this definition is that it *cannot* be dynamically dispatched: neither `Serialize` nor `Serializer` are object-safe because generic methods are not object safe. If you need to serialize a heterogenous collection of objects (as is sometimes required by JSON schemas, for example), this definition is problematic.

## Dynamic handshake

**..each trait takes a trait object of the other.**

{% highlight rust %}
trait Serialize {
    fn serialize(&self, serializer: &mut Serializer) -> Result<(), Error>;
}

trait Serializer {
    //...
    fn serialize_map_value(&mut self, state: &mut Self::MapState, value: &Serialize)
        -> Result<(), Error>;

    fn serialize_seq_elt(&mut self, state: &mut Self::SeqState, elt: &Serialize)
        -> Result<(), Error>;
    //...
}
{% endhighlight %}

The counter to the static handshake is the dynamic handshake - instead of having methods which are generic over one another, the two traits have methods which take dynamically dispatched trait objects. The `erased_serde` library provides these definitions, allowing you to have dynamically dispatched serialization (and it even uses blanket impls so that all serde serializers and serializeables can be used with its dynamic definitions).

The disadvantage of this approach is, similarly, the advantage of the prior approach - these are dynamic calls which cannot be optimized away. Since serialization is a kind of 'tree walking' - traversing a struct down to its primitive members - this produces a large number of short dynamic function calls that can't be inlined or optimized.

This also makes associated types rather difficult to work with, since they must all be specified in the trait object. erased_serde deals with this by using one `Error` type instead of allowing serializers to define their own errors.

## One-sided handshake

**..one trait is generic over the other trait.**

{% highlight rust %}
trait Serialize<S: Serializer> {
    fn serialize(&self, serializer: &mut S) -> Result<(), S::Error>;
}

trait Serializer {
    //...
    fn serialize_map_value<S>(&mut self, state: &mut Self::MapState, value: &S)
        -> Result<(), S::Error>
    where S: Serialize<Self>;

    fn serialize_seq_elt<S>(&mut self, state: &mut Self::SeqState, elt: &S)
        -> Result<(), S::Error>
    where S: Serialize<Self>;
    //...
}
{% endhighlight %}

In the static definition, `Serialize` was not object safe because its method was generic. If we push that parameter up to the definition of the trait, though, the trait *is* object safe. If you know what serializer you want to serialize to, you can create a `Box<Serialize<json::Serializer>>` (for example).

Its important to note that this only enables that specific sort of dynamic dispatch though - you cannot, for example, construct a heterogenous collection of serializers. If you're looking at a handshake situation and you want to use this pattern, you need to decide which side needs the dynamic dispatch most strongly.

The biggest downside of this approach compared to the static handshake is that pushing the parameter out like this causes it to infect any bound using the `Serialize` trait. You can no longer have `where T: Serialize` - you need `where T: Serialize<S>, S: Serializer`, Because you've added another parameter, this infection doesn't stop there.

For example, let's say you have a type that wraps any serializeable type, and functions which operate on that type. The second parameter is pushed indefinitely upward:


{% highlight rust %}
struct SerializeHolder<T: Serialize<S>, S: Serializer> {
    serializeable: T,
    _spoopy: PhantomData<S>
}

fn process_holder<T, S>(holder: SerializeHolder<T, S>) where
    T: Serialize<S>,
    S: Serializer,
{
    //...
}
{% endhighlight %}

As a sidebar, we do have a solution to this: a language feature called "higher rank parameters." These are parameters introduced *in* the bound, instead of being attached to the type or function that the bound is applied to - this essentially stops the upward drift of that extra type parameter. Currently, this powerful feature is restricted to lifetimes, but in theory we could extend it to types, like so:

{% highlight rust %}
fn function_that_takes_a_serializeable<T>(serial: T)
    where for<S: Serializer> T: Serialize<S>
{
    //...
}
{% endhighlight %}

Not today, though.

This pattern has one other weakness: the definition of `Serializer` has changed in a subtle but important way. Instead of being parametric over `S: Serialize`, it is parametric over `S: Serialize<Self>`. This means that you cannot assume your serializeable type can be serialized by _any_ serializer, only by the serializer you are implementing.

This actually breaks the current serde JSON serializer, which uses a second Serializer type to restrict JSON Object keys to be Strings. There is an alternative pattern for this kind of behavior based on specialization, but that is out of scope for this blog post.

## Three-way handshake

**..combining the advantages of static and one-sided handshake, you implement three traits.**

{% highlight rust %}

trait Serialize {
    fn serialize<S: Serializer>(&self, serializer: &mut S) -> Result<(), S::Error>;
}

trait SerializeTo<S: Serializer> {
    fn serialize_to(&self, serializer: &mut S) -> Result<(), S::Error>;
}

impl<S, T> SerializeTo<S> for T where
    S: Serializer,
    T: Serialize,
{
  fn serialize_to(&self, serializer: &mut S) -> Result<(), S::Error> {
    self.serialize(serializer)
  }
}

trait Serializer {
    //...
    fn serialize_map_value<S>(&mut self, state: &mut Self::MapState, value: &S)
        -> Result<(), S::Error>
    where S: SerializeTo<Self>;


    fn serialize_seq_elt<S>(&mut self, state: &mut Self::SeqState, elt: &S)
        -> Result<(), S::Error>
    where S: SerializeTo<Self>;
    //...
}
{% endhighlight %}

There is a way to "fake" higher rank parameters, and that's by introducing a third trait. Here we have taken the one-sided definition of `Serialize` and named it `SerializeTo`. We've also taken the definition of `Serializer` from the one-sided handshake. However, `Serialize` is exactly the same definition as in the static handshake.

We then provide a blanket impl of `SerializeTo<S: Serializer>` for all types which implement `Serialize`. This essentially makes `where T: Serialize` equivalent to `where for<S: Serializer> T: SerializeTo<S>`.

Note that this still has the other caveats of the one-handed handshake: only `SerializeTo`, not Serializer, is object safe, and some patterns that serde currently uses are not possible.

I do think this is the best fit for serialization, and I have a PR to break serde to use this definition. The serde maintainers asked me to benchmark this compared to `erased_serde`, which is a very reasonable request I have not followed up on at all - my bad. If anyone is interested in performing benchmarks on these patterns, please contact me.

## Other possibilities?

The point of this is not to push for a particular pattern as applied to serde, but to explore the broader design questions it represents. Rust forces you to think about the representation of your code, giving you the possibility of greater performance, but requiring you to consider the trade offs each approach takes.

I'm very interesting in hearing about other ways the handshake could be implemented, and about other, similar design problems for which there are multiple solutions in Rust with trade offs between them to consider.
