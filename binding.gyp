{
    "targets": [
        {
            "target_name": "addon",
            "sources": [
                "native/addon.c",
                "native/config.c",
                "native/tunnel.c",
                "native/excep.c",
                "native/debug.c"
            ],
            "actions": [
                {
                    "action_name": "prebuild_step",
                    "inputs": [],
                    "outputs": ["<(module_root_dir)/.prebuild-step-done"],
                    "action": [
                        "node", "./install.cjs"
                    ]
                }
            ],
            "include_dirs": [
                "<(module_root_dir)",
                "<!(node -p \"require('node-api-headers').include\")"
            ],
            "defines": [
                "NAPI_VERSION=8",
                "_NOEXPORT_PINGGY_DLL_"
            ],
            "conditions": [
                ["OS==\"win\"", {
                    "defines": [
                        "_WINDOWS_OS_"
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
                    "libraries": ["<(module_root_dir)/libpinggy.so"],
                    "cflags": ["-ggdb", "-Wno-ignored-qualifiers"],
                    "ldflags": ["-Wl,-rpath='$$ORIGIN/'"]
                }],
                ["OS==\"mac\"", {
                    "cflags": [
                        "-ggdb",
                        # minimum deployment target; adjust as needed
                        "-mmacosx-version-min=10.14"
                    ],
                    "link_settings": {
                        "libraries": [
                            # point at your .dylib
                            "<(module_root_dir)/libpinggy.dylib",
                            # embed rpaths so the loader searches next to the .node
                            "-Wl,-rpath,@loader_path",
                            "-Wl,-rpath,@loader_path/.."
                        ]
                    },
                    "xcode_settings": {
                        # ensures binary compatibility
                        "MACOSX_DEPLOYMENT_TARGET": "10.14"
                    }
                }]
            ]
        }
    ]
}
