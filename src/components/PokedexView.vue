<template>
  <div class="pokedex">
    <input type="text" v-model="searchQuery" @input="handleSearchInput" placeholder="Buscar Pokémon..."
      class="search-input" />

    <div v-if="loading">Cargando Pokémon...</div>

    <div v-else class="pokemon-list">
      <div v-for="pokemon in displayedPokemons" :key="pokemon.name" class="pokemon-card"
        :style="{ borderColor: getPastelColor(pokemon.types?.[0] || 'normal') }" @click="selectPokemon(pokemon)">
        <img :src="getPokemonImageUrl(pokemon)" :alt="pokemon.name" class="pokemon-img" />
        <div class="pokemon-name">{{ pokemon.name }}</div>
        <div class="pokemon-description">
          {{ pokemon.description || 'Sin descripción' }}
        </div>
        <div class="pokemon-generation">
          Gen {{ pokemon.generation || '?' }}
        </div>
      </div>
    </div>

    <button v-if="!loadingMore && !searchQuery" class="load-more-btn" @click="loadMore">
      Cargar más
    </button>
    <div v-else-if="loadingMore">Cargando más Pokémon...</div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <button class="close-btn" @click="closeModal">✖</button>

        <h3 class="modal-title">{{ selectedPokemon.name }}</h3>
        <img :src="getPokemonImageUrl(selectedPokemon)" :alt="selectedPokemon.name" class="modal-img-large" />

        <p><strong>Tipos:</strong> {{ selectedPokemon.types.join(', ') }}</p>

        <p><strong>Stats:</strong></p>
        <ul class="stats-list">
          <li v-for="stat in selectedPokemon.stats" :key="stat.stat.name">
            {{ stat.stat.name }}: {{ stat.base_stat }}
          </li>
        </ul>

        <p><strong>Descripción:</strong> {{ description }}</p>

        <p><strong>Hábitat:</strong> {{ habitat || 'Desconocido' }}</p>

        <div class="evolution-sections">
          <div class="pre-evo">
            <h4>Pre-evolución</h4>
            <div class="evo-list" v-if="preEvolutions.length">
              <div v-for="pre in preEvolutions" :key="pre.name" class="evo-pokemon"
                @click="selectPokemonByName(pre.name)">
                <img :src="getPokemonImageUrl(pre)" :alt="pre.name" />
                <p>{{ pre.name }}</p>
              </div>
            </div>
            <p v-else>No tiene pre-evoluciones.</p>
          </div>

          <div class="evolutions">
            <h4>Evolución</h4>
            <div class="evo-list" v-if="evolutions.length">
              <div v-for="evo in evolutions" :key="evo.name" class="evo-pokemon" @click="selectPokemonByName(evo.name)">
                <img :src="getPokemonImageUrl(evo)" :alt="evo.name" />
                <p>{{ evo.name }}</p>
              </div>
            </div>
            <p v-else>No tiene evoluciones.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
export default {
  name: "PokedexView",
  data() {
    return {
      allPokemons: [], // lista completa nombres y urls
      pokemons: [], // lista paginada con detalles para la vista
      loading: true,
      loadingMore: false,
      searchQuery: "",
      offset: 0,
      limit: 20,
      showModal: false,
      selectedPokemon: null,
      description: "",
      habitat: "",
      evolutions: [],
      preEvolutions: [],
      generation: "",
    };
  },
  computed: {
    filteredPokemons() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return this.pokemons;

      // filtramos en la lista completa nombres por substring
      return this.allPokemons
        .filter((p) => p.name.includes(q))
        .map((p) => {
          // Tratamos de encontrar en los pokemons con detalles, si no existe ponemos sólo nombre y url
          const detailed = this.pokemons.find((dp) => dp.name === p.name);
          return (
            detailed || {
              name: p.name,
              url: p.url,
              types: ["normal"], // tipo por defecto para mostrar color
              description: "",
              generation: "",
              stats: [],
            }
          );
        });
    },
    displayedPokemons() {
      return this.filteredPokemons;
    },
  },
  mounted() {
    this.fetchAllPokemons();
    this.loadMore();
  },
  methods: {
    async fetchAllPokemons() {
      try {
        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000");
        const data = await res.json();
        this.allPokemons = data.results;
      } catch (e) {
        console.error("Error al cargar lista completa de Pokémon:", e);
      }
    },
    async loadMore() {
      if (this.loadingMore) return;
      this.loadingMore = true;
      try {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon?offset=${this.offset}&limit=${this.limit}`
        );
        const data = await res.json();

        const detailedPromises = data.results.map(async (pokemon) => {
          const res = await fetch(pokemon.url);
          const details = await res.json();

          // También traemos especie para descripción y generación
          const speciesRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${pokemon.name}`
          );
          const speciesData = await speciesRes.json();

          const flavorTextEntry =
            speciesData.flavor_text_entries.find(
              (entry) => entry.language.name === "es"
            ) || speciesData.flavor_text_entries[0];
          const description = flavorTextEntry
            ? flavorTextEntry.flavor_text.replace(/\n|\f/g, " ")
            : "Sin descripción";

          const generation = speciesData.generation
            ? speciesData.generation.name
            : "Desconocida";

          return {
            name: pokemon.name,
            url: pokemon.url,
            types: details.types.map((t) => t.type.name),
            stats: details.stats,
            description,
            generation,
          };
        });

        const newPokemons = await Promise.all(detailedPromises);
        this.pokemons = [...this.pokemons, ...newPokemons];
        this.offset += this.limit;
      } catch (e) {
        console.error("Error cargando más Pokémon:", e);
      } finally {
        this.loadingMore = false;
        this.loading = false;
      }
    },
    getPokemonImageUrl(pokemon) {
      const id = pokemon.url.split("/").filter(Boolean).pop();
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    },
    getTypeColor(type) {
      const colors = {
        fire: "#f08030",
        water: "#6890f0",
        grass: "#78c850",
        electric: "#f8d030",
        ice: "#98d8d8",
        fighting: "#c03028",
        poison: "#a040a0",
        ground: "#e0c068",
        flying: "#a890f0",
        psychic: "#f85888",
        bug: "#a8b820",
        rock: "#b8a038",
        ghost: "#705898",
        dragon: "#7038f8",
        dark: "#705848",
        steel: "#b8b8d0",
        fairy: "#f0b6bc",
        normal: "#a8a878",
      };
      return colors[type] || "#ccc";
    },
    getPastelColor(type) {
      const pastelColors = {
        fire: "#ffe5d0",
        water: "#d6ecff",
        grass: "#defde0",
        electric: "#fff8c0",
        psychic: "#ffd9ec",
        ice: "#e0f7ff",
        dragon: "#e6d6ff",
        dark: "#d8d8d8",
        fairy: "#ffe6f0",
        bug: "#f0f5d6",
        rock: "#eee5d6",
        ghost: "#e6d6ff",
        ground: "#f5e6c6",
        steel: "#e6e6f0",
        poison: "#f5d6f0",
        flying: "#e6f0ff",
        fighting: "#fdd8d8",
        normal: "#f5f5f5",
      };
      return pastelColors[type] || "#eee";
    },

    getLightColor(type) {
      // Tonos pastel claros para borde
      const lightColors = {
        fire: "#f6d3b0",
        water: "#b9d5ff",
        grass: "#c7e4a9",
        electric: "#fbf3b6",
        ice: "#d9f0f0",
        fighting: "#f1b1ae",
        poison: "#d3b5d7",
        ground: "#f3e8bb",
        flying: "#d3cfff",
        psychic: "#f9b6bd",
        bug: "#dbe5a6",
        rock: "#ded8b7",
        ghost: "#c6c0d7",
        dragon: "#cdc9f9",
        dark: "#c6c1b8",
        steel: "#d3d5db",
        fairy: "#f9d7da",
        normal: "#dfdfb2",
      };
      return lightColors[type] || "#eee";
    },
    getCardStyle(pokemon) {
      const type = pokemon.types && pokemon.types.length ? pokemon.types[0] : "normal";
      return {
        backgroundColor: this.getTypeColor(type),
        border: `4px solid ${this.getLightColor(type)}`,
        color: "#333",
      };
    },
    async selectPokemon(pokemon) {
      // Si no tiene stats (sin detalles), cargamos detalles antes
      if (!pokemon.stats || pokemon.stats.length === 0) {
        try {
          const res = await fetch(pokemon.url);
          const details = await res.json();

          const speciesRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${pokemon.name}`
          );
          const speciesData = await speciesRes.json();

          const flavorTextEntry =
            speciesData.flavor_text_entries.find(
              (entry) => entry.language.name === "es"
            ) || speciesData.flavor_text_entries[0];
          const description = flavorTextEntry
            ? flavorTextEntry.flavor_text.replace(/\n|\f/g, " ")
            : "Sin descripción";

          const generation = speciesData.generation
            ? speciesData.generation.name
            : "Desconocida";

          // Actualizamos en pokemons
          const detailedPokemon = {
            name: pokemon.name,
            url: pokemon.url,
            types: details.types.map((t) => t.type.name),
            stats: details.stats,
            description,
            generation,
          };

          // Guardamos en pokemons para cachear
          this.pokemons.push(detailedPokemon);
          this.selectedPokemon = detailedPokemon;
          this.description = description;
          this.generation = generation;

          await this.loadSpeciesDetails(speciesData);
        } catch (e) {
          console.error("Error cargando detalles del Pokémon:", e);
          this.selectedPokemon = pokemon;
          this.description = "Sin descripción";
          this.habitat = "";
          this.evolutions = [];
          this.preEvolutions = [];
        }
      } else {
        this.selectedPokemon = pokemon;
        this.description = pokemon.description || "Sin descripción";
        this.generation = pokemon.generation || "Desconocida";

        // Cargar info de especie para habitat y evoluciones
        try {
          const speciesRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${pokemon.name}`
          );
          const speciesData = await speciesRes.json();

          await this.loadSpeciesDetails(speciesData);
        } catch (e) {
          console.error("Error cargando detalles de especie:", e);
          this.habitat = "";
          this.evolutions = [];
          this.preEvolutions = [];
        }
      }

      this.showModal = true;
    },
    async loadSpeciesDetails(speciesData) {
      this.habitat = speciesData.habitat ? speciesData.habitat.name : "Desconocido";

      // Cargamos cadena de evolución para separar evoluciones y pre-evoluciones
      if (!speciesData.evolution_chain || !speciesData.evolution_chain.url) {
        this.evolutions = [];
        this.preEvolutions = [];
        return;
      }

      const evoChainRes = await fetch(speciesData.evolution_chain.url);
      const evoChainData = await evoChainRes.json();

      const chain = evoChainData.chain;

      // Función para buscar nodo del Pokémon en cadena evolución
      const findChainNode = (node, name) => {
        if (node.species.name === name) return node;
        for (const evo of node.evolves_to) {
          const found = findChainNode(evo, name);
          if (found) return found;
        }
        return null;
      };

      const currentNode = findChainNode(chain, this.selectedPokemon.name);

      // Pre-evoluciones: nodo padre(s) (si existe)
      const findParentNode = (node, name, parent = null) => {
        if (node.species.name === name) return parent;
        for (const evo of node.evolves_to) {
          const found = findParentNode(evo, name, node);
          if (found) return found;
        }
        return null;
      };

      const parentNode = findParentNode(chain, this.selectedPokemon.name);

      // Pre-evoluciones: si hay parent, lo ponemos
      this.preEvolutions = [];
      if (parentNode) {
        // El nodo padre representa la pre-evolución
        const speciesName = parentNode.species.name;
        // Buscar en pokemons o traer detalles para mostrar imagen
        const preEvo = this.pokemons.find((p) => p.name === speciesName);
        if (preEvo) this.preEvolutions = [preEvo];
        else {
          // Si no está en cache, traemos detalles rápido
          try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesName}`);
            const details = await res.json();
            this.preEvolutions = [
              {
                name: speciesName,
                url: `https://pokeapi.co/api/v2/pokemon/${speciesName}`,
                types: details.types.map((t) => t.type.name),
              },
            ];
          } catch {
            this.preEvolutions = [];
          }
        }
      }

      // Evoluciones: hijos del nodo actual
      this.evolutions = [];
      if (currentNode && currentNode.evolves_to.length > 0) {
        const evoPromises = currentNode.evolves_to.map(async (evo) => {
          const speciesName = evo.species.name;
          let evoData = this.pokemons.find((p) => p.name === speciesName);
          if (!evoData) {
            try {
              const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesName}`);
              const details = await res.json();
              evoData = {
                name: speciesName,
                url: `https://pokeapi.co/api/v2/pokemon/${speciesName}`,
                types: details.types.map((t) => t.type.name),
              };
            } catch {
              evoData = {
                name: speciesName,
                url: `https://pokeapi.co/api/v2/pokemon/${speciesName}`,
                types: ["normal"],
              };
            }
          }
          return evoData;
        });

        this.evolutions = await Promise.all(evoPromises);
      }
    },
    closeModal() {
      this.showModal = false;
      this.selectedPokemon = null;
      this.description = "";
      this.habitat = "";
      this.evolutions = [];
      this.preEvolutions = [];
    },
    async handleSearchInput() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return;

      // Buscar en allPokemons los que coincidan
      const matchedPokemons = this.allPokemons.filter((p) =>
        p.name.includes(q)
      );

      // Para cada que no tenga detalles, cargarlos
      const loadDetailsPromises = matchedPokemons.map(async (p) => {
        if (this.pokemons.find((pk) => pk.name === p.name)) return;

        try {
          const res = await fetch(p.url);
          const details = await res.json();

          const speciesRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${p.name}`
          );
          const speciesData = await speciesRes.json();

          const flavorTextEntry =
            speciesData.flavor_text_entries.find(
              (entry) => entry.language.name === "es"
            ) || speciesData.flavor_text_entries[0];
          const description = flavorTextEntry
            ? flavorTextEntry.flavor_text.replace(/\n|\f/g, " ")
            : "Sin descripción";

          const generation = speciesData.generation
            ? speciesData.generation.name
            : "Desconocida";

          this.pokemons.push({
            name: p.name,
            url: p.url,
            types: details.types.map((t) => t.type.name),
            stats: details.stats,
            description,
            generation,
          });
        } catch (e) {
          console.error("Error cargando detalles para búsqueda:", e);
        }
      });

      await Promise.all(loadDetailsPromises);
    },
    async selectPokemonByName(name) {
      // Buscar en pokemons y seleccionar
      let pokemon = this.pokemons.find((p) => p.name === name);
      if (!pokemon) {
        try {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
          const details = await res.json();

          const speciesRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${name}`
          );
          const speciesData = await speciesRes.json();

          const flavorTextEntry =
            speciesData.flavor_text_entries.find(
              (entry) => entry.language.name === "es"
            ) || speciesData.flavor_text_entries[0];
          const description = flavorTextEntry
            ? flavorTextEntry.flavor_text.replace(/\n|\f/g, " ")
            : "Sin descripción";

          pokemon = {
            name,
            url: `https://pokeapi.co/api/v2/pokemon/${name}`,
            types: details.types.map((t) => t.type.name),
            stats: details.stats,
            description,
            generation: speciesData.generation
              ? speciesData.generation.name
              : "Desconocida",
          };

          this.pokemons.push(pokemon);
        } catch (e) {
          console.error("Error cargando Pokémon para selección:", e);
          return;
        }
      }
      this.selectPokemon(pokemon);
    },
  },
};
</script>

<style scoped>
.pokedex {
  max-width: 1100px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 1rem;
}

h2 {
  text-align: center;
  margin-bottom: 1rem;
}

.search-input {
  display: block;
  margin: 0 auto 2rem;
  padding: 0.6rem 1rem;
  font-size: 1.1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  max-width: 400px;
  width: 100%;
}

.pokemon-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.pokemon-card {
  position: relative;
  background-color: #ffffff;
  border-radius: 20px;
  padding: 1rem;
  text-transform: capitalize;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 4px solid #eee;
}

.pokemon-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

.pokemon-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  z-index: 0;
  opacity: 0.2;
}

.pokemon-img-wrapper {
  width: 96px;
  height: 96px;
  margin-bottom: 0.7rem;
}

.pokemon-img {
  background-color: white;
  border-radius: 50%;
  padding: 0.5rem;
  width: 96px;
  height: 96px;
  object-fit: contain;
  z-index: 1;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pokemon-name {
  font-weight: bold;
  font-size: 1.1rem;
  text-transform: capitalize;
  margin-bottom: 0.3rem;
}

.pokemon-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0.2rem 0;
  color: #333;
  z-index: 1;
}

.pokemon-description {
  font-size: 0.85rem;
  color: #666;
  text-align: center;
  margin-bottom: 0.5rem;
  z-index: 1;
}

.pokemon-generation {
  font-size: 0.8rem;
  color: #999;
  align-self: flex-end;
  z-index: 1;
}

/* Botón cargar más */
.load-more-btn {
  display: block;
  margin: 2rem auto 0;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 15px;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 8px rgb(0 0 0 / 0.15);
  transition: background-color 0.3s ease;
}

.load-more-btn:hover {
  background-color: #45a045;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 1.5rem 2rem 2rem;
  border-radius: 18px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  text-align: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.stats-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 1rem 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
}

.stats-list li {
  background-color: #f0f0f0;
  border-radius: 12px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 100px;
  text-transform: capitalize;
  box-shadow: inset 0 -3px 5px rgba(0, 0, 0, 0.1);
}

.detail-section {
  margin-top: 1rem;
  text-align: left;
}

.detail-section h3 {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
  color: #444;
  border-bottom: 2px solid #ddd;
  padding-bottom: 0.2rem;
}

.evolution-list {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.evolution-card {
  cursor: pointer;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
  padding: 0.6rem;
  width: 100px;
  text-align: center;
  background-color: #fafafa;
  transition: box-shadow 0.2s ease;
  user-select: none;
}

.evolution-card:hover {
  box-shadow: 0 6px 15px rgb(0 0 0 / 0.2);
}

.evolution-img {
  width: 80px;
  height: 80px;
  image-rendering: pixelated;
  margin-bottom: 0.3rem;
}

.evolution-name {
  text-transform: capitalize;
  font-weight: 600;
  font-size: 1rem;
  color: #333;
}

/* Colores según tipos - ejemplo básico */
.type-fire {
  background-color: #FDDFDF;
  border: 1px solid #F08030;
  color: #9C531F;
}

.type-water {
  background-color: #DEF3FD;
  border: 1px solid #6890F0;
  color: #445E9C;
}

.type-grass {
  background-color: #DEFDE0;
  border: 1px solid #78C850;
  color: #4E8234;
}

.type-electric {
  background-color: #FCF7DE;
  border: 1px solid #F8D030;
  color: #A1871F;
}

.type-psychic {
  background-color: #EAEDA1;
  border: 1px solid #F85888;
  color: #A13959;
}

.type-ice {
  background-color: #E0F5FF;
  border: 1px solid #98D8D8;
  color: #638D8D;
}

.type-dark {
  background-color: #A9A9A9;
  border: 1px solid #705848;
  color: #49392F;
}

.type-fairy {
  background-color: #FCEAFF;
  border: 1px solid #EE99AC;
  color: #9B6470;
}

.type-normal {
  background-color: #F5F5F5;
  border: 1px solid #A8A878;
  color: #6D6D4E;
}

/* Ajustes responsive para modal */
@media (max-width: 640px) {
  .modal-content {
    padding: 1rem;
    width: 95%;
  }

  .modal-img {
    width: 160px;
    height: 160px;
  }

  .evolution-card {
    width: 80px;
  }
}
</style>