{
  "targets": [
    {
      "target_name": "addon",
      "sources": ["src/addon.c", "src/tunnel.c", "src/config.c"],
      "libraries": ["-L$(PWD)/", "-lpinggy"],
      "cflags": ["-ggdb"]
    }
  ]
}