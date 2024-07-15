<script setup lang="ts">
import '@/assets/main.css';
import { onMounted, ref, reactive } from 'vue';
import type { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import draggable from 'vuedraggable'

const client = generateClient<Schema>();

// create a reactive reference to the array of todos
const todos = ref<Array<Schema['Todo']["type"]>>([]);
const drag = ref<Boolean>(false)

function listTodos() {
  client.models.Todo.observeQuery().subscribe({
    next: ({ items, isSynced }) => {
      todos.value = items
    },
  });
}

function createTodo() {
  client.models.Todo.create({
    content: window.prompt("Todo content")
  }).then(() => {
    // After creating a new todo, update the list of todos
    listTodos();
  });
}


function deleteTodo(id: string) {
  client.models.Todo.delete({ id })
}

// fetch todos when the component is mounted
onMounted(() => {
  listTodos();
});

</script>

<template>
  <main>
    <h1>My todos</h1>
    <button @click="createTodo">+ new</button>
    <ul>
      <draggable v-model="todos" group="things" item-key="id" @start="drag = true" @false="drag = false">
        <template #item="{ element }" >
          <li style="display: grid; grid-template-columns: 1fr auto; align-items: center;">
            <span>
              {{ element.content }}
            </span>
            <span>
              <button @click="deleteTodo(element.id)">✔</button>
            </span>
          </li>
        </template>
      </draggable>
    </ul>
    <div>
      🥳 App successfully hosted. Try creating a new todo.
      <br />
      <a href="https://docs.amplify.aws/gen2/start/quickstart/nextjs-pages-router/">
        Review next steps of this tutorial.
      </a>
    </div>
  </main>
</template>
