<template>
  <div id="app">
    <header class="app-header">
      <h1 class="app-title">Pokédex</h1>
      <p class="app-subtitle">Explora y descubre todos los Pokémon</p>
    </header>
    <main>
      <PokedexView />
    </main>
    <footer class="app-footer">
      <small>Datos obtenidos de <a href="https://pokeapi.co" target="_blank" rel="noopener noreferrer">PokéAPI</a></small>
    </footer>
  </div>
</template>

<script>
import PokedexView from './components/PokedexView.vue';

export default {
  name: 'App',
  components: {
    PokedexView,
  },
};
</script>

<style scoped>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #e0f7fa, #a0d8ef);
  min-height: 100vh;
  color: #222;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  box-sizing: border-box;
}

.app-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem 2rem;
  background: #ffcb05;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(255, 203, 5, 0.4);
  width: 100%;
  max-width: 600px;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: #3b4cca; /* Azul pokémon */
  text-shadow: 2px 2px #f44336; /* sombra roja para darle estilo */
  margin: 0;
  letter-spacing: 0.1em;
}

.app-subtitle {
  font-size: 1.2rem;
  color: #555;
  margin-top: 0.5rem;
  font-style: italic;
}

main {
  width: 100%;
  max-width: 960px;
  flex-grow: 1;
}

.app-footer {
  margin-top: 2rem;
  font-size: 0.85rem;
  color: #666;
}

.app-footer a {
  color: #3b4cca;
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}
</style>

