{
  "targets": [
    {
      "target_name": "addon",
      "sources": ["src/addon.c", "src/tunnel.c", "src/config.c"],
      # "sources": ["src/addon2.c"],
      "libraries": ["-L$(PWD)/", "-lpinggy"],
      "cflags": ["-ggdb", "-Wno-ignored-qualifiers"]
    }
  ]
}