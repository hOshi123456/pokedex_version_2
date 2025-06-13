<template>
  <div class="pokedex-view" :class="{ 'dark-theme': isDarkMode }">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="pokeball-loader"></div>
      <p>Cargando Pokémon...</p>
    </div>

    <!-- Grid Component -->
    <PokedexGrid
      v-else
      :pokemons="filteredPokemons"
      :isDarkMode="isDarkMode"
      :caughtPokemons="caughtPokemons"
      @pokemon-selected="showPokemonDetails"
      @toggle-caught="toggleCaught"
    />

    <!-- Modal Component -->
<PokemonModal
  v-if="showModal"
  :visible="showModal"
  :pokemon="selectedPokemon"
  :isDarkMode="isDarkMode"
  :isCaught="selectedPokemon ? isCaught(selectedPokemon.id) : false"
  @close="closeModal"
  @toggle-caught="toggleCaught"
  @select-pokemon="selectPokemonByName"
/>

  </div>
</template>

<script>
import PokedexGrid from './PokedexGrid.vue'
import PokemonModal from './PokemonModal.vue'

export default {
  name: 'PokedexView',
  components: { 
    PokedexGrid,
    PokemonModal 
  },
  props: {
    searchQuery: {
      type: String,
      default: ''
    },
    isDarkMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      pokemons: [],
      filteredPokemons: [],
      showModal: false,
      selectedPokemon: null,
      loading: true,
      caughtPokemons: new Set(),
      // Clave para localStorage
      STORAGE_KEY: 'pokedex_caught_pokemon',
    };
  },
  watch: {
    searchQuery: {
      handler: 'onFilterTextChanged',
      immediate: true
    }
  },
  created() {
    this.loadUserData();
  },
  mounted() {
    this.fetchPokemons();
  },
  methods: {
    // ============ DATA FETCHING ============
    async fetchPokemons() {
      try {
        this.loading = true;
        const BATCH_SIZE = 50;
        const TOTAL_POKEMON = 721;
        const batches = Math.ceil(TOTAL_POKEMON / BATCH_SIZE);
        
        for (let batch = 0; batch < batches; batch++) {
          const start = batch * BATCH_SIZE + 1;
          const end = Math.min((batch + 1) * BATCH_SIZE, TOTAL_POKEMON);
          
          const promises = [];
          for (let i = start; i <= end; i++) {
            promises.push(
              fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)
                .then((res) => res.json())
                .catch((error) => {
                  console.error(`Error fetching pokemon ${i}:`, error);
                  return null;
                })
            );
          }
          
          const batchData = await Promise.all(promises);
          const processedBatch = batchData
            .filter(poke => poke !== null)
            .map((poke) => ({
              id: poke.id,
              name: poke.name,
              types: poke.types.map((t) => t.type.name),
              typesFormatted: poke.types.map((t) => t.type.name).join(', '),
              image: poke.sprites.other['official-artwork'].front_default || poke.sprites.front_default,
              generation: this.getGeneration(poke.id),
              generationShort: this.getGenerationShort(poke.id),
              stats: poke.stats,
              height: poke.height,
              weight: poke.weight,
              caught: this.isCaught(poke.id)
            }));
          
          this.pokemons.push(...processedBatch);
          this.filteredPokemons = [...this.pokemons];
        }
        
        this.emitStats();
      } catch (error) {
        console.error('Error fetching pokemons:', error);
      } finally {
        this.loading = false;
      }
    },

    // ============ FILTERING ============
    onFilterTextChanged() {
      const query = this.searchQuery.toLowerCase();
      this.filteredPokemons = this.pokemons.filter((pokemon) =>
        pokemon.name.toLowerCase().includes(query) ||
        pokemon.types.some(type => type.toLowerCase().includes(query))
      );
      this.emitStats();
    },

    // ============ MODAL MANAGEMENT ============
    async showPokemonDetails(pokemon) {
        console.log('[DEBUG] showPokemonDetails (desde padre) con:', pokemon);
      this.selectedPokemon = { ...pokemon };
      
      // Fetch additional details
      try {
        const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`);
        const speciesData = await speciesRes.json();

        // Add description
        const flavor = speciesData.flavor_text_entries.find((entry) => entry.language.name === 'es') ||
                      speciesData.flavor_text_entries.find((entry) => entry.language.name === 'en');
        this.selectedPokemon.description = flavor
          ? flavor.flavor_text.replace(/\n|\f/g, ' ')
          : 'Sin descripción';

        // Add habitat
        this.selectedPokemon.habitat = speciesData.habitat ? speciesData.habitat.name : 'Desconocido';

        // Fetch evolution data
        if (speciesData.evolution_chain && speciesData.evolution_chain.url) {
          const evoRes = await fetch(speciesData.evolution_chain.url);
          const evoData = await evoRes.json();
          const evolutionData = await this.extractEvolutions(evoData.chain, pokemon.name);
          this.selectedPokemon.preEvolutions = evolutionData.preEvolutions;
          this.selectedPokemon.evolutions = evolutionData.evolutions;
        }
      } catch (error) {
        console.error('Error fetching details:', error);
        this.selectedPokemon.description = 'Error al cargar descripción';
        this.selectedPokemon.habitat = 'Desconocido';
        this.selectedPokemon.preEvolutions = [];
        this.selectedPokemon.evolutions = [];
      }

      this.showModal = true;
      console.log('[DEBUG] showModal ===', this.showModal);
    },

    closeModal() {
      this.showModal = false;
      this.selectedPokemon = null;
    },

    selectPokemonByName(name) {
      const found = this.pokemons.find((p) => p.name === name);
      if (found) {
        this.showPokemonDetails(found);
      }
    },

    // ============ EVOLUTION PROCESSING ============
    async extractEvolutions(chain, pokemonName) {
      const evolutions = [];
      const preEvolutions = [];

      const traverse = async (node, prev) => {
        if (node.species.name === pokemonName && prev) {
          const prevData = await this.getPokemonByName(prev);
          if (prevData) {
            preEvolutions.push({ name: prev, id: prevData.id });
          }
        }
        
        for (const evo of node.evolves_to) {
          if (node.species.name === pokemonName) {
            const evoData = await this.getPokemonByName(evo.species.name);
            if (evoData) {
              evolutions.push({ name: evo.species.name, id: evoData.id });
            }
          }
          await traverse(evo, node.species.name);
        }
      };
      
      await traverse(chain, null);
      return { preEvolutions, evolutions };
    },

    async getPokemonByName(name) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        return await response.json();
      } catch (error) {
        console.error(`Error fetching pokemon ${name}:`, error);
        return null;
      }
    },

    // ============ CAUGHT POKEMON MANAGEMENT (PERSISTENTE) ============
    toggleCaught(pokemon) {
      if (this.isCaught(pokemon.id)) {
        this.caughtPokemons.delete(pokemon.id);
      } else {
        this.caughtPokemons.add(pokemon.id);
      }
      
      // Guardar inmediatamente en localStorage
      this.saveUserData();
      this.updatePokemonCaughtStatus();
      this.emitStats();
    },

    isCaught(pokemonId) {
      return this.caughtPokemons.has(pokemonId);
    },

    updatePokemonCaughtStatus() {
      this.pokemons.forEach(pokemon => {
        pokemon.caught = this.isCaught(pokemon.id);
      });
      this.filteredPokemons.forEach(pokemon => {
        pokemon.caught = this.isCaught(pokemon.id);
      });
      this.$nextTick(() => {
        this.onFilterTextChanged();
      });
    },

    // ============ FUNCIONES DE UTILIDAD ============
    getGeneration(id) {
      if (id <= 151) return 'Kanto (Gen I)';
      if (id <= 251) return 'Johto (Gen II)';
      if (id <= 386) return 'Hoenn (Gen III)';
      if (id <= 493) return 'Sinnoh (Gen IV)';
      if (id <= 649) return 'Unova (Gen V)';
      if (id <= 721) return 'Kalos (Gen VI)';
      if (id <= 809) return 'Alola (Gen VII)';
      if (id <= 905) return 'Galar (Gen VIII)';
      if (id <= 1010) return 'Paldea (Gen IX)';
      return 'Desconocida';
    },

    getGenerationShort(id) {
      if (id <= 151) return 'I';
      if (id <= 251) return 'II';
      if (id <= 386) return 'III';
      if (id <= 493) return 'IV';  
      if (id <= 649) return 'V';
      if (id <= 721) return 'VI';
      if (id <= 809) return 'VII';
      if (id <= 905) return 'VIII';
      if (id <= 1010) return 'IX';
      return '?';
    },

    getTopCaughtTypes() {
      const typeCount = {};
      this.pokemons
        .filter(p => this.isCaught(p.id))
        .forEach(pokemon => {
          pokemon.types.forEach(type => {
            typeCount[type] = (typeCount[type] || 0) + 1;
          });
        });
      
      return Object.fromEntries(
        Object.entries(typeCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      );
    },

    // ============ PERSISTENCIA DE DATOS (localStorage) ============
    saveUserData() {
      try {
        const userData = {
          caughtPokemons: Array.from(this.caughtPokemons),
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
        console.log('Datos guardados en localStorage:', userData.caughtPokemons.length, 'pokémon atrapados');
      } catch (error) {
        console.error('Error al guardar datos en localStorage:', error);
        // Fallback: mostrar mensaje al usuario
        this.$emit('storage-error', 'No se pudieron guardar los datos. Revisa el almacenamiento del navegador.');
      }
    },

    loadUserData() {
      try {
        const storedData = localStorage.getItem(this.STORAGE_KEY);
        
        if (storedData) {
          const userData = JSON.parse(storedData);
          
          // Validar que los datos sean correctos
          if (userData.caughtPokemons && Array.isArray(userData.caughtPokemons)) {
            this.caughtPokemons = new Set(userData.caughtPokemons);
            console.log('Datos cargados desde localStorage:', userData.caughtPokemons.length, 'pokémon atrapados');
            
            // Mostrar cuándo se guardaron por última vez
            if (userData.lastUpdated) {
              const lastUpdate = new Date(userData.lastUpdated);
              console.log('Última actualización:', lastUpdate.toLocaleString());
            }
          }
        } else {
          console.log('No se encontraron datos guardados, empezando desde cero');
        }
      } catch (error) {
        console.error('Error al cargar datos desde localStorage:', error);
        // Inicializar con datos vacíos si hay error
        this.caughtPokemons = new Set();
        this.$emit('storage-error', 'No se pudieron cargar los datos guardados.');
      }
    },

    // ============ FUNCIONES ADICIONALES DE GESTIÓN ============
    
    // Limpiar todos los pokémon atrapados
    clearAllCaught() {
      this.caughtPokemons.clear();
      this.saveUserData();
      this.updatePokemonCaughtStatus();
      this.emitStats();
    },

    // Exportar datos de pokémon atrapados
    exportCaughtData() {
      try {
        const caughtData = {
          caughtPokemons: Array.from(this.caughtPokemons),
          exportDate: new Date().toISOString(),
          totalCaught: this.caughtPokemons.size
        };
        
        const dataStr = JSON.stringify(caughtData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `pokedex_datos_atrapados_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error al exportar datos:', error);
      }
    },

    // Importar datos de pokémon atrapados
    importCaughtData(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.caughtPokemons && Array.isArray(importedData.caughtPokemons)) {
              this.caughtPokemons = new Set(importedData.caughtPokemons);
              this.saveUserData();
              this.updatePokemonCaughtStatus();
              this.emitStats();
              
              resolve(importedData.caughtPokemons.length);
            } else {
              reject(new Error('Formato de archivo inválido'));
            }
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
      });
    },

    // ============ STATS & EXPORT ============
    exportToCSV() {
      const headers = ['ID', 'Nombre', 'Tipos', 'Región', 'Altura (m)', 'Peso (kg)', 'Atrapado'];
      const csvData = [headers];
      
      this.filteredPokemons.forEach(pokemon => {
        csvData.push([
          pokemon.id,
          pokemon.name,
          pokemon.types.join(', '),
          pokemon.generation,
          (pokemon.height / 10).toFixed(1),
          (pokemon.weight / 10).toFixed(1),
          this.isCaught(pokemon.id) ? 'Sí' : 'No'
        ]);
      });
      
      const csvString = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pokedex_filtrado_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    emitStats() {
      const stats = {
        totalPokemons: this.pokemons.length,
        filteredCount: this.filteredPokemons.length,
        caughtCount: this.caughtPokemons.size,
        topCaughtTypes: this.getTopCaughtTypes(),
        canExport: this.filteredPokemons.length > 0
      };
      this.$emit('update-stats', stats);
    }
  },
};
</script>

<style scoped>
/* ============ VARIABLES Y BASE ============ */
.pokedex-view {
  --primary-color: #3b82f6;
  --secondary-color: #f59e0b;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --info-color: #06b6d4;
  
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  padding: 1rem;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  transition: all 0.3s ease;
}

.pokedex-view.dark-theme {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --border-color: #475569;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
  
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

/* ============ LOADING ============ */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1.5rem;
}

.loading-container p {
  color: var(--text-secondary);
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0;
}

.pokeball-loader {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(
    to bottom,
    #dc2626 0%,
    #dc2626 45%,
    #1f2937 45%,
    #1f2937 55%,
    #f8fafc 55%,
    #f8fafc 100%
  );
  position: relative;
  animation: pokeball-spin 1.5s linear infinite;
  box-shadow: var(--shadow-lg);
}

.pokeball-loader::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--bg-primary);
  border: 3px solid #1f2937;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@keyframes pokeball-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ============ RESPONSIVE ============ */
@media (max-width: 768px) {
  .pokedex-view {
    padding: 0.5rem;
  }
}
</style>