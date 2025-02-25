{
  "targets": [
    {
      "target_name": "addon",
      "sources": ["native/addon.c", "native/tunnel.c", "native/config.c", "native/excep.c"],
      "libraries": ["-L$(PWD)/", "-lpinggy"],
      "cflags": ["-ggdb", "-Wno-ignored-qualifiers"]
    }
  ]
}