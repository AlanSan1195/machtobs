cmake_minimum_required(VERSION 3.28)

project(machtobs-advanced-control VERSION 0.1.0 LANGUAGES C)

find_package(libobs REQUIRED)
find_package(obs-frontend-api REQUIRED)

add_library(machtobs-advanced-control MODULE
  src/plugin-main.c
)

target_compile_features(machtobs-advanced-control PRIVATE c_std_17)
target_include_directories(machtobs-advanced-control PRIVATE vendor)
target_link_libraries(machtobs-advanced-control PRIVATE
  OBS::libobs
  OBS::obs-frontend-api
)

set_target_properties(machtobs-advanced-control PROPERTIES
  PREFIX ""
  OUTPUT_NAME "machtobs-advanced-control"
)

if(APPLE)
  set_target_properties(machtobs-advanced-control PROPERTIES
    BUNDLE TRUE
    BUNDLE_EXTENSION "plugin"
    MACOSX_BUNDLE_INFO_PLIST "${CMAKE_CURRENT_SOURCE_DIR}/cmake/Info.plist.in"
  )

  add_custom_command(TARGET machtobs-advanced-control POST_BUILD
    COMMAND "${CMAKE_COMMAND}" -E make_directory
      "$<TARGET_BUNDLE_DIR:machtobs-advanced-control>/Contents/Resources/data/obs-plugins/machtobs-advanced-control/locale"
    COMMAND "${CMAKE_COMMAND}" -E copy
      "${CMAKE_CURRENT_SOURCE_DIR}/data/locale/en-US.ini"
      "$<TARGET_BUNDLE_DIR:machtobs-advanced-control>/Contents/Resources/data/obs-plugins/machtobs-advanced-control/locale/en-US.ini"
    COMMAND "${CMAKE_COMMAND}" -E copy
      "${CMAKE_CURRENT_SOURCE_DIR}/data/locale/es-ES.ini"
      "$<TARGET_BUNDLE_DIR:machtobs-advanced-control>/Contents/Resources/data/obs-plugins/machtobs-advanced-control/locale/es-ES.ini"
  )
endif()

