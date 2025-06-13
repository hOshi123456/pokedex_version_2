<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="$emit('close')">
          <span>✕</span>
        </button>

        <div class="modal-header">
          <div class="pokemon-basic-info">
            <div class="pokemon-id">#{{ String(pokemon?.id).padStart(3, '0') }}</div>
            <h2 class="modal-title">{{ pokemon?.name }}</h2>
            
            <!-- Tipos compactos en header -->
            <div class="types-compact">
              <span 
                v-for="type in pokemon?.types" 
                :key="type"
                class="type-badge-compact"
                :style="{ backgroundColor: getTypeColor(type) }"
              >
                {{ type }}
              </span>
            </div>
          </div>
          
          <div class="pokemon-image-section">
            <div class="pokemon-image-container">
              <img
                :src="getPokemonImageUrl(pokemon)"
                :alt="pokemon?.name"
                class="modal-img"
                @load="onImageLoad"
              />
            </div>
            
            <!-- Botón de captura -->
            <button 
              @click="$emit('toggle-caught', pokemon)"
              class="catch-btn"
              :class="{ caught: isCaught }"
              :title="isCaught ? 'Liberar Pokémon' : 'Atrapar Pokémon'"
            >
              <span class="pokeball">{{ isCaught ? '🔴' : '⚪' }}</span>
              {{ isCaught ? 'Atrapado' : 'Atrapar' }}
            </button>
          </div>
        </div>

        <div class="modal-body">
          <!-- Información básica compacta -->
          <div class="pokemon-info-compact">
            <div class="info-row">
              <div class="info-item">
                <span class="info-icon">📏</span>
                <span class="info-text">{{ (pokemon?.height / 10).toFixed(1) }}m</span>
              </div>
              <div class="info-item">
                <span class="info-icon">⚖️</span>
                <span class="info-text">{{ (pokemon?.weight / 10).toFixed(1) }}kg</span>
              </div>
              <div class="info-item">
                <span class="info-icon">🌍</span>
                <span class="info-text">{{ pokemon?.generation || 'Desconocida' }}</span>
              </div>
            </div>
          </div>

          <!-- Descripción compacta -->
          <div v-if="description" class="description-compact">
            <p class="pokemon-description">{{ description }}</p>
          </div>

          <!-- Estadísticas en grid compacto -->
          <div class="stats-section-compact">
            <h4 class="section-title">Estadísticas Base</h4>
            <div class="stats-grid-compact">
              <div v-for="stat in pokemon?.stats" :key="stat.stat.name" class="stat-compact">
                <div class="stat-header">
                  <span class="stat-name-short">{{ getStatShortName(stat.stat.name) }}</span>
                  <span class="stat-value">{{ stat.base_stat }}</span>
                </div>
                <div class="stat-bar-mini">
                  <div 
                    class="stat-fill" 
                    :style="{ 
                      width: Math.min((stat.base_stat / 255) * 100, 100) + '%',
                      backgroundColor: getStatColor(stat.base_stat)
                    }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="stats-total-compact">
              <strong>Total: {{ getTotalStats(pokemon?.stats) }}</strong>
            </div>
          </div>

          <!-- Evoluciones compactas -->
          <div class="evolution-section-compact" v-if="preEvolutions.length || evolutions.length">
            <h4 class="section-title">Evoluciones</h4>
            <div class="evolution-chain-compact">
              <!-- Pre-evoluciones -->
              <div class="evolution-mini" v-for="pre in preEvolutions" :key="pre.name" @click="$emit('select-pokemon', pre.name)">
                <img :src="getEvolutionImage(pre.name)" :alt="pre.name" class="evolution-img-mini" />
                <span class="evolution-name-mini">{{ pre.name }}</span>
              </div>
              
              <!-- Flecha si hay pre-evolución -->
              <div v-if="preEvolutions.length" class="evolution-arrow-mini">→</div>

              <!-- Pokémon actual -->
              <div class="evolution-mini current">
                <img :src="getPokemonImageUrl(pokemon)" :alt="pokemon?.name" class="evolution-img-mini" />
                <span class="evolution-name-mini">{{ pokemon?.name }}</span>
              </div>

              <!-- Flecha si hay evolución -->
              <div v-if="evolutions.length" class="evolution-arrow-mini">→</div>
              
              <!-- Evoluciones -->
              <div class="evolution-mini" v-for="evo in evolutions" :key="evo.name" @click="$emit('select-pokemon', evo.name)">
                <img :src="getEvolutionImage(evo.name)" :alt="evo.name" class="evolution-img-mini" />
                <span class="evolution-name-mini">{{ evo.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'PokemonModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    pokemon: {
      type: Object,
      default: null
    },
    isCaught: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      default: ''
    },
    preEvolutions: {
      type: Array,
      default: () => []
    },
    evolutions: {
      type: Array,
      default: () => []
    },
    allPokemons: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'toggle-caught', 'select-pokemon'],
  methods: {
    getPokemonImageUrl(pokemon) {
      return pokemon?.image || '';
    },

    onImageLoad(event) {
      event.target.classList.add('loaded');
    },

    getEvolutionImage(name) {
      const localPokemon = this.allPokemons.find(p => p.name === name);
      if (localPokemon) {
        return localPokemon.image;
      }
      return `https://img.pokemondb.net/artwork/large/${name}.jpg`;
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

    getStatColor(value) {
      if (value >= 120) return '#4CAF50';
      if (value >= 90) return '#8BC34A';
      if (value >= 60) return '#FFC107';
      if (value >= 30) return '#FF9800';
      return '#F44336';
    },

    getStatShortName(statName) {
      const statNames = {
        'hp': 'HP',
        'attack': 'ATK',
        'defense': 'DEF',
        'special-attack': 'SpA',
        'special-defense': 'SpD',
        'speed': 'SPD'
      };
      return statNames[statName] || statName;
    },

    getTotalStats(stats) {
      return stats ? stats.reduce((total, stat) => total + stat.base_stat, 0) : 0;
    }
  }
};
</script>

<style scoped>
/* ============ VARIABLES Y BASE ============ */
.modal-overlay {
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
}

:root.dark {
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
}

/* ============ MODAL ============ */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modal-appear 0.3s ease;
}

@keyframes modal-appear {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--bg-tertiary);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: bold;
}

.close-btn:hover {
  background: var(--danger-color);
  color: white;
  transform: scale(1.1);
}

/* ============ MODAL HEADER ============ */
.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  border-bottom: 1px solid var(--border-color);
}

.pokemon-basic-info {
  flex: 1;
}

.pokemon-id {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.modal-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  text-transform: capitalize;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.types-compact {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.type-badge-compact {
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.2s ease;
  position: relative;
  overflow: hidden;
}

.type-badge-compact:hover {
  transform: translateY(-2px);
}

.type-badge-compact::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.type-badge-compact:hover::before {
  left: 100%;
}

.pokemon-image-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pokemon-image-container {
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.pokemon-image-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg,
    transparent,
    var(--primary-color),
    transparent,
    var(--secondary-color),
    transparent
  );
  animation: rotate 3s linear infinite;
  opacity: 0.3;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.pokemon-image-container:hover {
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.modal-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  z-index: 2;
  position: relative;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s ease;
}

.modal-img:hover {
  transform: scale(1.05);
}

.catch-btn {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 120px;
  justify-content: center;
}

.catch-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.catch-btn.caught {
  background: linear-gradient(135deg, var(--success-color), #059669);
  color: white;
  border-color: #059669;
}

.pokeball {
  font-size: 1.25rem;
  transition: transform 0.2s ease;
}

.catch-btn:hover .pokeball {
  transform: rotate(360deg);
}

/* ============ MODAL BODY ============ */
.modal-body {
  padding: 2rem;
}

.pokemon-info-compact {
  margin-bottom: 2rem;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  transition: transform 0.2s ease;
}

.info-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.info-icon {
  font-size: 1.25rem;
}

.info-text {
  font-weight: 600;
  color: var(--text-primary);
}

.description-compact {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--primary-color);
}

.pokemon-description {
  margin: 0;
  line-height: 1.6;
  color: var(--text-secondary);
  font-style: italic;
}

/* ============ ESTADÍSTICAS ============ */
.stats-section-compact {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '📊';
  font-size: 1.5rem;
}

.stats-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-compact {
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  transition: transform 0.2s ease;
}

.stat-compact:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.stat-name-short {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-bar-mini {
  width: 100%;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
  position: relative;
}

.stat-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.stats-total-compact {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border-radius: var(--radius-lg);
  font-size: 1.125rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* ============ EVOLUCIONES ============ */
.evolution-section-compact {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.evolution-section-compact .section-title::before {
  content: '🔄';
}

.evolution-chain-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.evolution-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.evolution-mini:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.evolution-mini.current {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), var(--bg-primary));
  box-shadow: var(--shadow-md);
}

.evolution-img-mini {
  width: 60px;
  height: 60px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  transition: transform 0.2s ease;
}

.evolution-mini:hover .evolution-img-mini {
  transform: scale(1.1);
}

.evolution-name-mini {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: capitalize;
  text-align: center;
}

.evolution-arrow-mini {
  font-size: 1.5rem;
  color: var(--primary-color);
  font-weight: bold;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ============ RESPONSIVE ============ */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .modal-title {
    font-size: 1.5rem;
  }
  
  .pokemon-image-container {
    width: 120px;
    height: 120px;
  }
  
  .modal-img {
    width: 100px;
    height: 100px;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .info-row {
    grid-template-columns: 1fr;
  }
  
  .stats-grid-compact {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .evolution-chain-compact {
    gap: 0.5rem;
  }
  
  .evolution-mini {
    min-width: 60px;
    padding: 0.75rem;
  }
  
  .evolution-img-mini {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 375px) {
  .modal-content {
    max-width: 95vw;
    padding: 1rem;
  }

  .modal-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .pokemon-image-container {
    width: 90px;
    height: 90px;
  }

  .modal-img {
    width: 70px;
    height: 70px;
  }

  .catch-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .pokemon-description {
    font-size: 0.9rem;
  }

  .evolution-img-mini {
    width: 35px;
    height: 35px;
  }

  .evolution-name-mini {
    font-size: 0.7rem;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .stats-grid-compact {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1rem;
  }
}


/* ============ SCROLLBAR CUSTOMIZATION ============ */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--secondary-color);
}
</style>