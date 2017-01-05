---
layout: post
title: The Rust module system is too confusing
categories: rust
---

A while ago I was considering an idea, so I wrote [a tweet](https://twitter.com/withoutboats/status/814201265575981056) to ask what folks thought about it.

A very spirited discussion followed about the Rust module system and what the pain points with it were (indeed - whether or not there were pain points at all). Depending on your skill at navigating Twitter's UI, you may or may not be able to read the whole discussion by following the link above. This post is just about my thoughts on the module system and how it could possibly be improved.

## The Rust module system is undesirably difficult to understand

We have a lot of empirical evidence that new users find the module system confusing - mainly in the form of posts on users.rust-lang.org & reddit, and messages in IRC and gitter. My (unquantified) feeling is that the module system is the most inquired about component of Rust after ownership and borrowing - ahead of concepts like traits, generics, and macros.

This seems quite unfortunate to me. In general, of course, new users finding the language confusing is bad, and we want to improve their experience. But in particular, it seems to me that the quirks of our module system are not buying us a whole lot. Comments by Graydon suggest that this system evolved to handle the inherent complexities of Rust's compilation model. But there is a distinction between the internal complexity of the system and the complexity it presents to the user, and my general impression is this - no one is writing blog posts about how revolutionary the module system is, therefore it should not be where so many of our complexity points are being spent.

(Sidebar - if your response to this is to think that the module system is not that complex, know that I also find the system fairly intuitive. You are probably already a Rust programmer, consider that we have both been filtered by survivorship bias; who knows how many Rust comrades we lost when their confusion with the module system discouraged them from continuing?)

I've constructed a hypothesis of why the Rust module system has so many people frustrated. The gist of it is that several individually well-motivated decisions compound into a collected practice which many users find unintuitive.

### There is simply a lot of syntax

The first point of complexity is that a lot of syntax is devoted to the module system. New users have to learn each piece of syntax and distinguish between them. If they misunderstand the dinstinction and use the wrong syntax, the compiler is not a mind reader, so the error messages they get are likely to be confusing.

Here's all the syntax:

1. `mod` declares a submodule, and adds it to the canonical module tree.
    * `mod` is actually two syntaxes: it can be a declaration relating to another file, or it can take a block to be an inline module.
2. `extern crate` is like `mod`, but it declares an external crate dependency instead of a submodule.
3. `use` imports a name from another namespace in the module graph into this namespace.
    * `pub use` not only imports it, but also publically exports it under this namespace as part of the non-canonical module graph.

Of these syntaxes, `use` and `pub use` feel like the most fundamental; both `mod` and `extern crate` are semi-redundant with other user actions (creating a new file, adding a dependency to Cargo.toml).

### Rust requires users to build an explicit module graph

Any language with namespaces necessarily has a graph of namespaces and how they relate to one another. One relatively uncommon aspect of Rust's system, though, is that users are required to explicitly construct the canonical tree of namespaces using `mod` and `extern crate` declarations. Many languages infer this tree from the file structure instead.

Rust requires this in part because submodules are private by default; in some other languages the notion of a private namespace doesn't really exist. As a result of the explicitness of Rust's system, its also common for users to sculpt the namespace they expose with `pub use`, simplifying it for users outside of this module.

### Some Rust source files are branch nodes in the module graph

In languages with an implicit canonical module tree, it is not uncommon for every file to be treated as a 'leaf' node of that tree. That is, no modules are actually submodules of other modules; there are just namespaces which contain nested namespaces (that is, they lack - or rarely utilize - an equivalent of the `mod.rs` file).

This difference in Rust interacts very poorly with the requirement to build explicit module graphs. It results in `mod foo;` behaving very similarly to `use self::foo;`. Consequently, users are troubled by the distinction between `mod` and `use`, and it can feel very arbitrary when `mod` is appropriate and when `use` is. This arbitrariness results in users feeling like the system is just complicated, confusing, and futile.

### 'use' and local paths start from a different point

Lastly, one thing that makes this a bit more complicated is that `use` takes paths starting from the root of the crate, while paths used inline in the module start from that module. I actually think this is not as big of an issue & the previous issue about 'branch nodes' is sometimes misdiagnosed as this issue.

## Requirements of the Rust module system

Having listed these downsides, I want to enumerate what I think the requirements are that any change to the system would have to uphold:

1. It cannot require any change to the Rust compilation model. The compilation model is Good and should not change (at least, not for the sake of surface syntax).
2. The recommended way of doing things cannot be less expressive than whatever we deprecate (at least not in any significant way). There should be a replacement way of doing everything people would want to do.
3. Names cannot magically be in local scope without any declaration. Its important that what's in scope be explicitly defined. The one exception to this may be extern crates in the root namespace, since we already accept that for `std`.
4. Of course, it needs to be backwards compatible, which means we can't actually eliminate syntax or completely change its semantics.

## Ideas for making Rust's module system more habitable

The basic idea that emerged out of that twitter conversation was this: we should find a way to get rid of `mod`; `extern crate` is not as bad, but it could go too. Here's how we could get rid of both syntaxes while keeping to all of the requirements above.

Of course this wouldn't be removing the syntax from the language - it would just be making it unnecessary & discouraging its use.

### Eliminating the use of 'mod foo;'

First, we introduce the idea of *implicit* modules - I know the word implicit is frightening, but bare with me! When we build the module tree, we walk the directory and pick up all paths that meet the current naming scheme we require, even if they don't have a `mod foo` associated with them. Those without a `mod` declaration associated with them are marked as "implicit" modules, distinguishing them from "explicit" modules.

Implicit modules are the same as explicit modules in almost every respect; they are parsed, they are walked for `#[test]` attributes and so on just the same. However, the names of implicit attributes are not imported into the namespace of their parent modules. That is, without declaring `mod foo;`, you can't access the `foo` symbol in the local namespace of a module.

Note, however, that the name *is* still in the canonical path tree underneath this namespace. So while `foo` is not accessible, `use self::foo` does work, and in other child modules `use super::foo` works as well. This introduces a distinction between the names in the canonical namespace used by `use` statements and the local namespace.

The result of this is that you must import the symbol in one of two ways:

* The current way of doing things: you make it an "explicit module" - `mod foo;`
* The new, recommended way of doing things: you import the symbol with `use self::foo;`.

If you want to make the submodule public, you just do a re-export: `pub use self::foo;`, and if you want to attach attributes to a submodule, you attach them inside that submodule using the `#![]` syntax.

(Note: for inline submodules, the `mod` syntax remains. The `mod` syntax is much less confusing in that case than when it looks very similar to a `use` statement.)

### Eliminating the use of 'extern crate foo;' (when using cargo)

Today, when cargo invokes rustc, it passes all of your external dependencies using an `--extern` flag in the form `--extern NAME=PATH`. When rustc compiles your code, it finds the crate named `NAME` at the filesystem path `PATH`.

We could simply instead treat any `--extern` flag passed to the compiler as an implicit, shadowable `extern crate NAME;` declaration; the `extern crate` declaration is not adding new information.

There are a few caveats though:

First, in order to replace `extern crate foo as bar;` we would need to support an alias directive inside the Cargo.toml. That is, your dependency object could have an `alias = "bar"` field, and it would be passed to the compiler as `--extern bar=PATH` instead.

Second, and more troubling, if we eliminate `extern crate` there is no place to attach attributes. Currently, by far the most used extern crate attribute is `#[macro_use]`. This attribute will itself be deprecated by macros 2.0. I would not consider deprecating `extern crate` until this attribute was deprecated. If you need to attach other attributes to your dependencies for some reason, you would still need to use `extern crate`, but hopefully that would be rare.

Third, it does not allow you the flexibility of mounting dependencies underneath submodules. I consider this an acceptable loss, but still a donwside of this proposal.

Fourth, `extern crate` is less confusing than `mod`, and also much more cool. Its one of the syntaxes (along with `impl`) that in my opinionin my opinion gives Rust a unique "steampunk" vibe. Aesthetically, I would be sad to see `extern crate` go.

For those reasons, I am more in favor of the first proposal to make `mod` statements go away than I am in favor of this proposal to do the same to `extern crate`.
