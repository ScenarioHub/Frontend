import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt()
  .prepend({ ignores: ["**/*.readonly.*"] })
  .overrideRules({
    "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
    "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
    "@typescript-eslint/unified-signatures": "off",
    "vue/max-attributes-per-line": ["error", { singleline: 9999, multiline: 1, max: 2 }],
    "vue/no-deprecated-slot-attribute": "off",
    "vue/singleline-html-element-content-newline": "off",
    "vue/v-bind-style": ["error", "shorthand", { sameNameShorthand: "always" }],
  });
