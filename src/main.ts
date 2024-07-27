import "./assets/main.css";
import { createApp } from "vue";
import { createPinia } from 'pinia'
import App from "./App.vue";
import { router } from "./router"
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount("#app")