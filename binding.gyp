{
    "targets": [
        {
            "target_name": "addon",
            "sources": [
                "native/addon.c",
                "native/config.c",
                "native/tunnel.c",
                "native/excep.c"
            ],
            "include_dirs": [
                "<(module_root_dir)",
                "<!(node -p \"require('node-api-headers').include\")"
            ],
            "defines": [
                "NAPI_VERSION=8",
                "__NOEXPORT_PINGGY_DLL__"
            ],
            "conditions": [
                ["OS==\"win\"", {
                    "defines": [
                        "__WINDOWS_OS__"
                    ],
                    "libraries": [
                        "<(module_root_dir)/pinggy.lib",
                        "Ws2_32.lib",
                        "msvcrt.lib",
                        "legacy_stdio_definitions.lib"
                    ],
                    "msvs_settings": {
                        "VCCLCompilerTool": {
                            "AdditionalIncludeDirectories": ["<(module_root_dir)"],
                            "RuntimeLibrary": "2",
                            "ExceptionHandling": "1",
                            "AdditionalOptions": ["/EHsc"]
                        },
                        "VCLinkerTool": {
                            "AdditionalLibraryDirectories": ["<(module_root_dir)"],
                            "AdditionalDependencies": [
                                "pinggy.lib",
                                "Ws2_32.lib",
                                "msvcrt.lib",
                                "legacy_stdio_definitions.lib"
                            ],
                            "GenerateDebugInformation": "true",
                            "IgnoreSpecificDefaultLibraries": ["LIBCMT"],
                            "AdditionalOptions": ["/NODEFAULTLIB:LIBCMT"]
                        }
                    }
                }],
                ["OS==\"linux\"", {
                    "libraries": ["-L$(PWD)/", "-lpinggy"],
                    "cflags": ["-ggdb", "-Wno-ignored-qualifiers"]
                }]
            ]
        }
    ]
}