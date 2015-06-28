var searchIndex = {};
searchIndex['burrito'] = {"items":[[0,"","burrito","`Burrito` is a monadic IO interface, similar to Haskell's IO monad.",null,null],[3,"Burrito","","The fundamental monadic type of the burrito library.",null,null],[5,"burrito","","Create a default burrito (wrapping the stdio handles).",null,{"inputs":[],"output":{"name":"burrito"}}],[11,"from_path","std::fs","",0,{"inputs":[{"name":"file"},{"name":"p"}],"output":{"name":"result"}}],[11,"from_addr","std::net::tcp","",1,{"inputs":[{"name":"tcpstream"},{"name":"a"}],"output":{"name":"result"}}],[8,"FromPath","burrito","",null,null],[10,"from_path","","",2,{"inputs":[{"name":"frompath"},{"name":"p"}],"output":{"name":"result"}}],[8,"FromAddr","","",null,null],[10,"from_addr","","",3,{"inputs":[{"name":"fromaddr"},{"name":"a"}],"output":{"name":"result"}}],[11,"wrap","","The basic constructor for `Burrito`. This takes an `io::Result<T>`, where `T` is the type\nbeing wrapped by the `Burrito`, `io::Result<T>` is the return type of the constructor for\nmost IO handle types.",4,{"inputs":[{"name":"burrito"},{"name":"result"}],"output":{"name":"burrito"}}],[11,"wrap_func","","A constructor for `Burrito` which takes a function and wraps the result of that function.",4,{"inputs":[{"name":"burrito"},{"name":"f"}],"output":{"name":"burrito"}}],[11,"from_path","","Constructs an IO handle using the path argument, according to that IO handle's\nimplementation of FromPath, then wraps that handle in a `Burrito`. It is a good idea to\ntype annotate this call to ensure the correct kind of handle is constructed.",4,{"inputs":[{"name":"burrito"},{"name":"p"}],"output":{"name":"burrito"}}],[11,"from_addr","","Constructs an IO handle using the addr argument, according to that IO handle's\nimplementation of FromAddr, then wraps that handle in a `Burrito`. It is a good idea to\ntype annotate this call to ensure the correct kind of handle is constructed.",4,{"inputs":[{"name":"burrito"},{"name":"a"}],"output":{"name":"burrito"}}],[11,"and","","Allows you to 'pivot' to a new `Burrito` if this one is good, or to remain in a state of\nfailure if this `Burrito` has failed. See the module level documentation for more info.",4,{"inputs":[{"name":"burrito"},{"name":"burrito"}],"output":{"name":"burrito"}}],[11,"and_then","","Allows access to data returned by the most recent IO call on this `Burrito`; this function\nmust return another `Burrito` of some kind or else diverge. See the module level\ndocumentation for more info.",4,{"inputs":[{"name":"burrito"},{"name":"f"}],"output":{"name":"burrito"}}],[11,"or","","Allows you to substitute this `Burrito` for another of the same type if it has gone bad.",4,{"inputs":[{"name":"burrito"},{"name":"burrito"}],"output":{"name":"burrito"}}],[11,"or_else","","Allows access to the error thrown if this `Burrito` has gone bad. This function must return\nanother `Burrito` of the same type or else diverge. See the module level documentation for\nmore info.",4,{"inputs":[{"name":"burrito"},{"name":"f"}],"output":{"name":"burrito"}}],[11,"ignore","","Drops any data returned by the most recent IO call.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"burrito"}}],[11,"is_good","","Returns true if the `Burrito` has not failed.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"bool"}}],[11,"is_bad","","Returns true if the `Burrito` has failed.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"bool"}}],[11,"ok","","Converts the `Burrito` to a `Result` of both the handle and the most recently returned\ndata.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"result"}}],[11,"to_data","","Converts the `Burrito` to a `Result` of the most recently returned data.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"result"}}],[11,"to_handle","","Converts the `Burrito` to a `Result` of the IO handle wrapped within.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"result"}}],[11,"default","","",4,{"inputs":[{"name":"burrito"}],"output":{"name":"burrito"}}],[11,"read","","Performs a read on the IO handle inside the burrito. Will read into a buffer of _n_ bytes.",4,{"inputs":[{"name":"burrito"},{"name":"usize"}],"output":{"name":"burrito"}}],[11,"read_to_end","","Reads to the end of the handle inside the burrito, returning a `Vec<u8>` of bytes.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"burrito"}}],[11,"read_to_string","","Reads everything from the handle into a `String`.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"burrito"}}],[11,"write","","Writes the content of the buf to the IO handle; returns the number of bytes written.",4,null],[11,"write_all","","Writes the content of the buf to the IO handle; will write all of the bytes unless it\nfails.",4,null],[11,"write_fmt","","Writes formatted text to the IO handle.",4,{"inputs":[{"name":"burrito"},{"name":"arguments"}],"output":{"name":"burrito"}}],[11,"seek","","Seeks to a position in the IO handle; returns the actual position that has been `seek`ed\nto.",4,{"inputs":[{"name":"burrito"},{"name":"seekfrom"}],"output":{"name":"burrito"}}],[11,"fill_buf","","Fills the buffer on the buffered reader. Unlike the underlying fill_buf macro, this does\nnot return a reference to the bytes in the buffer.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"burrito"}}],[11,"consume","","Marks `amt` bytes in the buffer as consumed.",4,{"inputs":[{"name":"burrito"},{"name":"usize"}],"output":{"name":"burrito"}}],[11,"read_until","","Reads from the buffered reader until the `byte` is reached.",4,{"inputs":[{"name":"burrito"},{"name":"u8"}],"output":{"name":"burrito"}}],[11,"read_line","","Reads a line from the buffered reader.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"burrito"}}],[11,"split","","Generates a Split Iterator of the underlying buffered reader. This will be wrapped in a\nresult because the IO handle may have failed at some point in the past.",4,{"inputs":[{"name":"burrito"},{"name":"u8"}],"output":{"name":"result"}}],[11,"lines","","Generates a Lines Iterator of the underlying buffered reader. This will be wrapped in a\nresult because the IO handle may have failed at some point in the past.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"result"}}],[11,"print_line","","Prints a string to stdout, with a newline affixed to the end. Internally, it calls\n`write_all`; to use it like the `println!()` macro, you can use a reference to a format \nmacro - that is `&format!()`.",4,{"inputs":[{"name":"burrito"},{"name":"str"}],"output":{"name":"burrito"}}],[11,"read_line","","Reads a line from stdin. This has the same behavior as the read_line() method on io::Stdin.",4,{"inputs":[{"name":"burrito"}],"output":{"name":"burrito"}}],[11,"write_to_err","","Performs a write to stderr instead of stdout.",4,null],[11,"write_all_to_err","","Performs a write_all to stderr instead of stdout.",4,null],[11,"write_fmt_to_err","","Performs a write_fmt to stderr instead of stdout.",4,{"inputs":[{"name":"burrito"},{"name":"arguments"}],"output":{"name":"burrito"}}]],"paths":[[3,"File"],[3,"TcpStream"],[8,"FromPath"],[8,"FromAddr"],[3,"Burrito"]]};
initSearch(searchIndex);
