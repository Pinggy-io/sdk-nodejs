{
  "targets": [
    {
      "target_name": "addon",
      "sources": ["src/addon.c"],
      "libraries": ["-L$(PWD)/", "-lpinggy"],
      "cflags": ["-ggdb"]
    }
  ]
}