/* eslint-disable */
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://qa.nuevoerp.co",
    viewportWidth: 1280,
    viewportHeight: 720,
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
