<template>
  <div id="app" :class="{ 'dark-theme': isDarkMode }">
    <header class="app-header">
      <div class="header-controls">
        <button @click="toggleDarkMode" class="theme-toggle" :title="isDarkMode ? 'Modo Claro' : 'Modo Oscuro'">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
        <button @click="showStats = !showStats" class="stats-toggle" :class="{ active: showStats }">
          📊 Dashboard
        </button>
        <button @click="exportToCSV" class="export-btn" :disabled="!canExport">
          📁 Exportar CSV
        </button>
      </div>
      
      <h1 class="app-title">
        <span class="pokeball-icon">⚪</span>
        Pokédex
      </h1>
      <p class="app-subtitle">Explora y descubre todos los Pokémon</p>
      
      <div class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          @input="onSearchChange"
          placeholder="Buscar Pokémon por nombre o tipo..."
          class="search-input"
        />
        <div class="search-icon">🔍</div>
      </div>
      
      <div class="pokemon-counter" v-if="totalPokemons > 0">
        {{ filteredCount }} de {{ totalPokemons }} Pokémon encontrados
      </div>
    </header>

    <!-- Dashboard Estadístico -->
    <div v-if="showStats" class="stats-dashboard">
      <div class="dashboard-header">
        <h2>📊 Dashboard Estadístico</h2>
        <button @click="showStats = false" class="close-dashboard">✕</button>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card caught">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <h3>Pokémon Atrapados</h3>
            <div class="stat-number">{{ caughtCount }}</div>
            <div class="stat-percentage">{{ caughtPercentage }}% del total</div>
          </div>
        </div>
        
        <div class="stat-card total">
          <div class="stat-icon">📚</div>
          <div class="stat-content">
            <h3>Total Pokémon</h3>
            <div class="stat-number">{{ totalPokemons }}</div>
            <div class="stat-percentage">Pokédex Nacional</div>
          </div>
        </div>
        
        <div class="stat-card progress">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <h3>Progreso</h3>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: caughtPercentage + '%' }"></div>
            </div>
            <div class="stat-percentage">{{ caughtCount }} / {{ totalPokemons }}</div>
          </div>
        </div>
        
        <div class="stat-card types">
          <div class="stat-icon">🌈</div>
          <div class="stat-content">
            <h3>Tipos Más Atrapados</h3>
            <div class="types-mini-chart">
              <div v-for="(count, type) in topCaughtTypes" :key="type" class="mini-type-bar">
                <span class="type-name">{{ type }}</span>
                <div class="mini-bar">
                  <div class="mini-fill" :style="{ 
                    width: (count / Math.max(...Object.values(topCaughtTypes)) * 100) + '%',
                    backgroundColor: getTypeColor(type)
                  }"></div>
                </div>
                <span class="type-count">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <main>
      <PokedexView 
        ref="pokedexView"
        :search-query="searchQuery"
        :is-dark-mode="isDarkMode"
        @update-stats="updateStats"
        @update-search="updateSearch"
        @export-data="handleExportCSV"
        @export-error="handleExportError"
      />
    </main>
    
    <!-- Notificación de exportación -->
    <div v-if="exportMessage" class="export-notification" :class="exportMessageType">
      {{ exportMessage }}
    </div>
    
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
  data() {
    return {
      isDarkMode: false,
      showStats: false,
      searchQuery: '',
      // Stats data
      totalPokemons: 0,
      filteredCount: 0,
      caughtCount: 0,
      topCaughtTypes: {},
      canExport: false,
      // User data cache
      userDataCache: null,
      // Export notification
      exportMessage: '',
      exportMessageType: '',
      exportTimeout: null,
    };
  },
  computed: {
    caughtPercentage() {
      return this.totalPokemons > 0 ? ((this.caughtCount / this.totalPokemons) * 100).toFixed(1) : 0;
    }
  },
  created() {
    this.loadUserData();
  },
  methods: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      this.saveUserData();
    },

    onSearchChange() {
      this.$nextTick(() => {
        this.updateSearch();
      });
    },

    updateSearch() {
      // Este método será llamado por el componente hijo para sincronizar la búsqueda
    },

    updateStats(stats) {
      this.totalPokemons = stats.totalPokemons || 0;
      this.filteredCount = stats.filteredCount || 0;
      this.caughtCount = stats.caughtCount || 0;
      this.topCaughtTypes = stats.topCaughtTypes || {};
      this.canExport = stats.canExport || false;
    },

    // Método simplificado para exportar CSV
    exportToCSV() {
      console.log('Iniciando exportación CSV...');
      
      // Verificar que el componente hijo existe
      if (!this.$refs.pokedexView) {
        console.error('Componente PokedexView no encontrado');
        this.showExportMessage('Error: Componente no encontrado', 'error');
        return;
      }

      // Verificar si hay Pokémon atrapados
      if (this.caughtCount === 0) {
        this.showExportMessage('No hay Pokémon atrapados para exportar', 'warning');
        return;
      }

      try {
        // Llamar al método del componente hijo
        const exportResult = this.$refs.pokedexView.requestExport();
        
        // Si el método retorna false, significa que no hay datos
        if (exportResult === false) {
          this.showExportMessage('No hay datos para exportar', 'warning');
          return;
        }

        console.log('Solicitud de exportación enviada');
        
      } catch (error) {
        console.error('Error al solicitar exportación:', error);
        this.showExportMessage('Error al procesar la exportación', 'error');
      }
    },

    // Maneja los datos recibidos del componente hijo
    handleExportCSV(data) {
      console.log('Datos recibidos para exportar:', data);
      
      if (!data || data.length === 0) {
        this.showExportMessage('No hay Pokémon atrapados para exportar', 'warning');
        return;
      }

      try {
        // Crear el contenido CSV con headers mejorados
        const headers = [
          'ID',
          'Nombre', 
          'Tipos',
          'Altura (m)',
          'Peso (kg)',
          'Habilidades',
          'HP',
          'Ataque',
          'Defensa',
          'Ataque Especial',
          'Defensa Especial',
          'Velocidad'
        ];

        // Procesar los datos de cada Pokémon
        const csvRows = data.map(pokemon => {
          const stats = pokemon.stats || [];
          const getStatValue = (statName) => {
            const stat = stats.find(s => s.name && s.name.toLowerCase().includes(statName.toLowerCase()));
            return stat ? stat.value : '0';
          };

          return [
            pokemon.id || '',
            `"${pokemon.name || ''}"`,
            `"${(pokemon.types || []).join(', ')}"`,
            (pokemon.height || 0) / 10, // Convertir a metros
            (pokemon.weight || 0) / 10, // Convertir a kg
            `"${(pokemon.abilities || []).join(', ')}"`,
            getStatValue('hp'),
            getStatValue('attack'),
            getStatValue('defense'),
            getStatValue('special-attack'),
            getStatValue('special-defense'),
            getStatValue('speed')
          ].join(',');
        });

        // Combinar headers y datos
        const csvContent = [headers.join(','), ...csvRows].join('\n');

        // Crear y descargar el archivo
        this.downloadCSV(csvContent, data.length);

      } catch (error) {
        console.error('Error al crear CSV:', error);
        this.showExportMessage('Error al crear el archivo CSV', 'error');
      }
    },

    // Método separado para manejar la descarga
    downloadCSV(csvContent, count) {
      try {
        // Crear el blob con BOM para UTF-8
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { 
          type: 'text/csv;charset=utf-8;' 
        });
        
        // Crear URL y elemento de descarga
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Configurar la descarga
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const fileName = `pokemon_atrapados_${dateStr}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.display = 'none';
        
        // Ejecutar descarga
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);

        // Mostrar mensaje de éxito
        this.showExportMessage(`¡Éxito! Se exportaron ${count} Pokémon atrapados`, 'success');
        
        console.log(`CSV descargado exitosamente: ${fileName}`);
        
      } catch (error) {
        console.error('Error en la descarga:', error);
        this.showExportMessage('Error al descargar el archivo', 'error');
      }
    },

    // Maneja errores de exportación del componente hijo
    handleExportError(errorMessage) {
      console.error('Error de exportación:', errorMessage);
      this.showExportMessage(errorMessage || 'Error en la exportación', 'error');
    },

    showExportMessage(message, type) {
      this.exportMessage = message;
      this.exportMessageType = type;
      
      // Limpiar timeout anterior si existe
      if (this.exportTimeout) {
        clearTimeout(this.exportTimeout);
      }
      
      // Ocultar mensaje después de 4 segundos
      this.exportTimeout = setTimeout(() => {
        this.exportMessage = '';
        this.exportMessageType = '';
      }, 4000);
    },

    getTypeColor(type) {
      const colors = {
        normal: '#A8A878',
        fire: '#F08030',
        water: '#6890F0',
        electric: '#F8D030',
        grass: '#78C850',
        ice: '#98D8D8',
        fighting: '#C03028',
        poison: '#A040A0',
        ground: '#E0C068',
        flying: '#A890F0',
        psychic: '#F85888',
        bug: '#A8B820',
        rock: '#B8A038',
        ghost: '#705898',
        dragon: '#7038F8',
        dark: '#705848',
        steel: '#B8B8D0',
        fairy: '#EE99AC'
      };
      return colors[type] || '#68A090';
    },

    saveUserData() {
      const userData = {
        isDarkMode: this.isDarkMode,
      };
      this.userDataCache = userData;
      // En un entorno real, esto se guardaría en localStorage
      // localStorage.setItem('pokedexUserData', JSON.stringify(userData));
    },

    loadUserData() {
      // En un entorno real, esto se cargaría desde localStorage
      // const userData = JSON.parse(localStorage.getItem('pokedexUserData') || '{}');
      
      const userData = this.userDataCache || {};
      this.isDarkMode = userData.isDarkMode || false;
    }
  },
  
  beforeUnmount() {
    // Limpiar timeout al destruir el componente
    if (this.exportTimeout) {
      clearTimeout(this.exportTimeout);
    }
  }
};
</script>

<style scoped>
/* Variables CSS */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #1e40af;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --dark-color: #374151;
  --light-color: #f8fafc;
  --border-radius: 12px;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark theme variables */
.dark-theme {
  --primary-color: #60a5fa;
  --secondary-color: #3b82f6;
  --success-color: #34d399;
  --warning-color: #fbbf24;
  --danger-color: #f87171;
  --dark-color: #f9fafb;
  --light-color: #1f2937;
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --bg-tertiary: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --border-color: #374151;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: var(--dark-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  box-sizing: border-box;
  transition: var(--transition);
  position: relative;
}

.dark-theme#app {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: var(--text-primary);
}

/* Export Notification */
.export-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: var(--border-radius);
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  max-width: 300px;
  animation: slideInRight 0.3s ease-out;
}

.export-notification.success {
  background: var(--success-color);
  color: white;
}

.export-notification.warning {
  background: var(--warning-color);
  color: white;
}

.export-notification.error {
  background: var(--danger-color);
  color: white;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Pokébola con CSS */
.pokeball {
  width: 20px;
  height: 20px;
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
  border: 2px solid #1f2937;
  position: relative;
  transition: all 0.2s ease;
}

.pokeball::before {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  background: #f8fafc;
  border: 1px solid #1f2937;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.pokeball.caught {
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
  animation: pokeball-glow 1s ease-in-out infinite alternate;
}

/* Para la pokébola mini en el grid */
.mini-pokeball {
  width: 16px;
  height: 16px;
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
  border: 1px solid #1f2937;
  position: relative;
}

.mini-pokeball::before {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  background: #f8fafc;
  border: 1px solid #1f2937;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.mini-pokeball.caught {
  box-shadow: 0 0 8px rgba(220, 38, 38, 0.5);
}

@keyframes pokeball-glow {
  0% { box-shadow: 0 0 10px rgba(220, 38, 38, 0.5); }
  100% { box-shadow: 0 0 15px rgba(220, 38, 38, 0.8); }
}

/* Header mejorado */
.app-header {
  text-align: center;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 900px;
  position: relative;
  transition: var(--transition);
}

.dark-theme .app-header {
  background: rgba(31, 41, 55, 0.95);
  color: var(--text-primary);
}

/* Header controls */
.header-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.theme-toggle,
.stats-toggle,
.export-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  background: var(--light-color);
  color: var(--dark-color);
  box-shadow: var(--shadow);
}

.dark-theme .theme-toggle,
.dark-theme .stats-toggle,
.dark-theme .export-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.theme-toggle:hover,
.stats-toggle:hover,
.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stats-toggle.active {
  background: var(--primary-color);
  color: white;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.export-btn:disabled:hover {
  transform: none;
  box-shadow: var(--shadow);
}

.app-title {
  font-size: 3rem;
  font-weight: 900;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.dark-theme .app-title {
  color: var(--primary-color);
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.pokeball-icon {
  font-size: 2.5rem;
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.app-subtitle {
  font-size: 1.2rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  font-style: italic;
  font-weight: 500;
}

.dark-theme .app-subtitle {
  color: var(--text-secondary);
}

/* Search container */
.search-container {
  position: relative;
  max-width: 500px;
  margin: 0 auto 1rem auto;
}

.search-input {
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  border-radius: var(--border-radius);
  border: 2px solid #e5e7eb;
  font-size: 1.1rem;
  transition: var(--transition);
  background: white;
  color: var(--dark-color);
  box-sizing: border-box;
}

.dark-theme .search-input {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
  color: #9ca3af;
  pointer-events: none;
}

.dark-theme .search-icon {
  color: var(--text-secondary);
}

.pokemon-counter {
  color: var(--dark-color);
  font-weight: 500;
  margin-top: 0.5rem;
  font-size: 0.95rem;
}

.dark-theme .pokemon-counter {
  color: var(--text-secondary);
}

/* Stats Dashboard */
.stats-dashboard {
  width: 100%;
  max-width: 900px;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius);
  padding: 2rem;
  box-shadow: var(--shadow-lg);
  transition: var(--transition);
}

.dark-theme .stats-dashboard {
  background: rgba(31, 41, 55, 0.95);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  margin: 0;
  color: var(--dark-color);
  font-size: 1.5rem;
  font-weight: 700;
}

.dark-theme .dashboard-header h2 {
  color: var(--text-primary);
}

.close-dashboard {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 50%;
  transition: var(--transition);
}

.dark-theme .close-dashboard {
  color: var(--text-secondary);
}

.close-dashboard:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

.dark-theme .close-dashboard:hover {
  background: rgba(255, 255, 255, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--light-color);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: var(--transition);
  box-shadow: var(--shadow);
}

.dark-theme .stat-card {
  background: var(--bg-secondary);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-card.caught {
  border-left: 4px solid var(--success-color);
}

.stat-card.total {
  border-left: 4px solid var(--primary-color);
}

.stat-card.progress {
  border-left: 4px solid var(--warning-color);
}

.stat-card.types {
  border-left: 4px solid var(--danger-color);
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--dark-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark-theme .stat-content h3 {
  color: var(--text-primary);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  line-height: 1;
}

.stat-percentage {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.dark-theme .stat-percentage {
  color: var(--text-secondary);
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.dark-theme .progress-bar {
  background: var(--bg-tertiary);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success-color), var(--primary-color));
  border-radius: 10px;
  transition: width 0.8s ease-out;
}

.types-mini-chart {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mini-type-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.type-name {
  min-width: 60px;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--dark-color);
}

.dark-theme .type-name {
  color: var(--text-primary);
}

.mini-bar {
  flex: 1;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.dark-theme .mini-bar {
  background: var(--bg-tertiary);
}

.mini-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease-out;
}

.type-count {
  min-width: 20px;
  text-align: right;
  font-weight: bold;
  color: var(--primary-color);
}

/* Main content */
main {
  width: 100%;
  max-width: 1200px;
  flex-grow: 1;
}

/* Footer */
.app-footer {
  margin-top: 2rem;
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
}

.dark-theme .app-footer {
  color: var(--text-secondary);
}

.app-footer a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.app-footer a:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  #app {
    padding: 1rem 0.5rem;
  }
  
  .app-header {
    padding: 1.5rem 1rem;
    margin-bottom: 1rem;
  }
  
  .app-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .pokeball-icon {
    font-size: 1.8rem;
  }
  
  .app-subtitle {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .header-controls {
    gap: 0.5rem;
  }
  
  .theme-toggle,
  .stats-toggle,
  .export-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
  
  .search-input {
    font-size: 1rem;
    padding: 0.75rem 2.5rem 0.75rem 0.75rem;
  }
  
  .stats-dashboard {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .export-notification {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 1.5rem;
  }
  
  .header-controls {
    flex-direction: column;
    align-items: center;
  }
  
  .theme-toggle,
  .stats-toggle,
  .export-btn {
    min-width: 140px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .types-mini-chart {
    width: 100%;
  }
  
  .mini-type-bar {
    justify-content: space-between;
  }
}

/* Animaciones de entrada */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-header {
  animation: fadeInUp 0.6s ease-out;
}

.stats-dashboard {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

main {
  animation: fadeInUp 0.6s ease-out 0.4s both;
}
</style>