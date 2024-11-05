import type { CustomThemeConfig } from "@skeletonlabs/tw-plugin"

export const chit_theme: CustomThemeConfig = {
    name: "chit_theme",
    properties: {
        // =~= Theme Properties =~=
        "--theme-font-family-base": `system-ui`,
        "--theme-font-family-heading": `system-ui`,
        "--theme-font-color-base": "0 0 0",
        "--theme-font-color-dark": "255 255 255",
        "--theme-rounded-base": "8px",
        "--theme-rounded-container": "8px",
        "--theme-border-base": "1px",
        // =~= Theme On-X Colors =~=
        "--on-primary": "0 0 0",
        "--on-secondary": "0 0 0",
        "--on-tertiary": "255 255 255",
        "--on-success": "0 0 0",
        "--on-warning": "0 0 0",
        "--on-error": "255 255 255",
        "--on-surface": "255 255 255",
        // =~= Theme Colors  =~=
        // primary | #e58b00
        "--color-primary-50": "251 238 217", // #fbeed9
        "--color-primary-100": "250 232 204", // #fae8cc
        "--color-primary-200": "249 226 191", // #f9e2bf
        "--color-primary-300": "245 209 153", // #f5d199
        "--color-primary-400": "237 174 77", // #edae4d
        "--color-primary-500": "229 139 0", // #e58b00
        "--color-primary-600": "206 125 0", // #ce7d00
        "--color-primary-700": "172 104 0", // #ac6800
        "--color-primary-800": "137 83 0", // #895300
        "--color-primary-900": "112 68 0", // #704400
        // secondary | #0EA5E9
        "--color-secondary-50": "219 242 252", // #dbf2fc
        "--color-secondary-100": "207 237 251", // #cfedfb
        "--color-secondary-200": "195 233 250", // #c3e9fa
        "--color-secondary-300": "159 219 246", // #9fdbf6
        "--color-secondary-400": "86 192 240", // #56c0f0
        "--color-secondary-500": "14 165 233", // #0EA5E9
        "--color-secondary-600": "13 149 210", // #0d95d2
        "--color-secondary-700": "11 124 175", // #0b7caf
        "--color-secondary-800": "8 99 140", // #08638c
        "--color-secondary-900": "7 81 114", // #075172
        // tertiary | #4F46E5
        "--color-tertiary-50": "229 227 251", // #e5e3fb
        "--color-tertiary-100": "220 218 250", // #dcdafa
        "--color-tertiary-200": "211 209 249", // #d3d1f9
        "--color-tertiary-300": "185 181 245", // #b9b5f5
        "--color-tertiary-400": "132 126 237", // #847eed
        "--color-tertiary-500": "79 70 229", // #4F46E5
        "--color-tertiary-600": "71 63 206", // #473fce
        "--color-tertiary-700": "59 53 172", // #3b35ac
        "--color-tertiary-800": "47 42 137", // #2f2a89
        "--color-tertiary-900": "39 34 112", // #272270
        // success | #84cc16
        "--color-success-50": "237 247 220", // #edf7dc
        "--color-success-100": "230 245 208", // #e6f5d0
        "--color-success-200": "224 242 197", // #e0f2c5
        "--color-success-300": "206 235 162", // #ceeba2
        "--color-success-400": "169 219 92", // #a9db5c
        "--color-success-500": "132 204 22", // #84cc16
        "--color-success-600": "119 184 20", // #77b814
        "--color-success-700": "99 153 17", // #639911
        "--color-success-800": "79 122 13", // #4f7a0d
        "--color-success-900": "65 100 11", // #41640b
        // warning | #f6d32d
        "--color-warning-50": "254 248 224", // #fef8e0
        "--color-warning-100": "253 246 213", // #fdf6d5
        "--color-warning-200": "253 244 203", // #fdf4cb
        "--color-warning-300": "251 237 171", // #fbedab
        "--color-warning-400": "249 224 108", // #f9e06c
        "--color-warning-500": "246 211 45", // #f6d32d
        "--color-warning-600": "221 190 41", // #ddbe29
        "--color-warning-700": "185 158 34", // #b99e22
        "--color-warning-800": "148 127 27", // #947f1b
        "--color-warning-900": "121 103 22", // #796716
        // error | #e01b24
        "--color-error-50": "250 221 222", // #faddde
        "--color-error-100": "249 209 211", // #f9d1d3
        "--color-error-200": "247 198 200", // #f7c6c8
        "--color-error-300": "243 164 167", // #f3a4a7
        "--color-error-400": "233 95 102", // #e95f66
        "--color-error-500": "224 27 36", // #e01b24
        "--color-error-600": "202 24 32", // #ca1820
        "--color-error-700": "168 20 27", // #a8141b
        "--color-error-800": "134 16 22", // #861016
        "--color-error-900": "110 13 18", // #6e0d12
        // surface | #35393b
        "--color-surface-50": "225 225 226", // #e1e1e2
        "--color-surface-100": "215 215 216", // #d7d7d8
        "--color-surface-200": "205 206 206", // #cdcece
        "--color-surface-300": "174 176 177", // #aeb0b1
        "--color-surface-400": "114 116 118", // #727476
        "--color-surface-500": "53 57 59", // #35393b
        "--color-surface-600": "48 51 53", // #303335
        "--color-surface-700": "40 43 44", // #282b2c
        "--color-surface-800": "32 34 35", // #202223
        "--color-surface-900": "26 28 29", // #1a1c1d
    },
}
