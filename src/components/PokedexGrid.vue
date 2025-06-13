<template>
    <div>
        <!-- Loading state -->
        <div v-if="loading" class="loading-container">
            <div class="pokeball-loader"></div>
            <p>Cargando Pokémon...</p>
        </div>

        <!-- Controls Bar -->
        <div v-else class="controls-bar">
            <div class="search-container">
                <input v-model="quickFilterText" placeholder="Buscar Pokémon..." class="search-input"
                    @input="onQuickFilterChanged">
                <span class="search-icon">🔍</span>
            </div>

            <div class="filter-buttons">
                <button :class="['filter-btn', { active: onlyShowCaught }]" @click="toggleCaughtFilter">
                    🔴 Solo Atrapados
                </button>
                <button :class="['filter-btn', { active: showAdvancedFilters }]" @click="toggleAdvancedFilters">
                    ⚙️ Filtros
                </button>
                <button class="filter-btn" @click="clearAllFilters">
                    🗑️ Limpiar
                </button>
            </div>

            <div class="view-controls">
                <select v-model="pageSize" @change="onPageSizeChanged" class="page-size-select">
                    <option value="10">10 por página</option>
                    <option value="20">20 por página</option>
                    <option value="50">50 por página</option>
                    <option value="100">100 por página</option>
                </select>

                <div class="stats">
                    <span class="stat-item">
                        Total: <strong>{{ filteredCount }}</strong>
                    </span>
                    <span class="stat-item">
                        Atrapados: <strong>{{ caughtCount }}</strong>
                    </span>
                </div>
            </div>
        </div>

        <!-- Advanced Filters Panel -->
        <div v-if="showAdvancedFilters && !loading" class="advanced-filters">
            <div class="filter-row">
                <div class="filter-group">
                    <label>Generación:</label>
                    <select v-model="selectedGeneration" @change="applyAdvancedFilters">
                        <option value="">Todas</option>
                        <option value="I">Gen I</option>
                        <option value="II">Gen II</option>
                        <option value="III">Gen III</option>
                        <option value="IV">Gen IV</option>
                        <option value="V">Gen V</option>
                        <option value="VI">Gen VI</option>
                        <option value="VII">Gen VII</option>
                        <option value="VIII">Gen VIII</option>
                        <option value="IX">Gen IX</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label>Tipo:</label>
                    <select v-model="selectedType" @change="applyAdvancedFilters">
                        <option value="">Todos</option>
                        <option v-for="type in availableTypes" :key="type" :value="type">
                            {{ type }}
                        </option>
                    </select>
                </div>

                <div class="filter-group">
                    <label>ID Desde:</label>
                    <input v-model.number="idFrom" type="number" min="1" max="1010" @input="applyAdvancedFilters"
                        class="number-input">
                </div>

                <div class="filter-group">
                    <label>ID Hasta:</label>
                    <input v-model.number="idTo" type="number" min="1" max="1010" @input="applyAdvancedFilters"
                        class="number-input">
                </div>
            </div>

            <div class="filter-row">
                <div class="filter-group type-badges">
                    <label>Filtrar por tipos múltiples:</label>
                    <div class="type-filter-badges">
                        <button v-for="type in availableTypes" :key="type"
                            :class="['type-filter-badge', { active: selectedTypes.includes(type) }]"
                            :style="{ backgroundColor: selectedTypes.includes(type) ? getTypeColor(type) : '' }"
                            @click="toggleTypeFilter(type)">
                            {{ type }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Selection Info -->
        <div v-if="selectedRows.length > 0 && !loading" class="selection-info">
            <div class="selection-content">
                <span>{{ selectedRows.length }} Pokémon seleccionado(s)</span>
                <div class="selection-actions">
                    <button @click="markSelectedAsCaught" class="action-btn catch-btn">
                        🔴 Marcar como Atrapados
                    </button>
                    <button @click="markSelectedAsNotCaught" class="action-btn release-btn">
                        ⚪ Marcar como No Atrapados
                    </button>
                    <button @click="exportSelected" class="action-btn export-btn">
                        📤 Exportar Selección
                    </button>
                    <button @click="clearSelection" class="action-btn clear-btn">
                        ❌ Limpiar Selección
                    </button>
                </div>
            </div>
        </div>


        <ag-grid-vue v-if="!loading" ref="agGrid" class="ag-theme-alpine pokemon-grid"
            :class="['pokemon-grid', { 'ag-theme-alpine-dark': isDarkMode, 'dark-mode': isDarkMode, 'full-dark-grid': isDarkMode }]"
            :rowData="filteredPokemons" :columnDefs="columnDefs" :defaultColDef="defaultColDef" :pagination="true"
            :paginationPageSize="pageSize" :domLayout="'autoHeight'" :suppressClickEdit="true"
            :rowSelection="'multiple'" :suppressCellFocus="true" :suppressRowHoverHighlight="false"
            :onCellClicked="onCellClicked" :onSelectionChanged="onSelectionChanged" :onRowClicked="onRowClicked"
            :onRowDoubleClicked="onRowDoubleClicked" :onCellDoubleClicked="onCellDoubleClicked"
            :onSortChanged="onSortChanged" :onFilterChanged="onFilterChanged" :onPaginationChanged="onPaginationChanged"
            :rowHeight="80" :headerHeight="50" :animateRows="true" :enableRangeSelection="true"
            :suppressMultiRangeSelection="false" :rowMultiSelectWithClick="true" :suppressRowDeselection="false"
            :enableCellTextSelection="true" :suppressMenuHide="false" :allowContextMenuWithControlKey="true"
            :getContextMenuItems="getContextMenuItems" :statusBar="statusBarConfig" :sideBar="sidebarConfig"
            :initialSortModel="[{ colId: 'name', sort: 'asc' }]">
        </ag-grid-vue>

    </div>
</template>

<script>
import { AgGridVue } from 'ag-grid-vue3';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
export default {
    name: 'PokedexGrid',
    components: {
        AgGridVue
    },
    props: {
        pokemons: {
            type: Array,
            default: () => []
        },
        isDarkMode: {
            type: Boolean,
            default: false
        },
        loading: {
            type: Boolean,
            default: false
        },
        caughtPokemons: {
            type: Set,
            default: () => new Set()
        }
    },
    data() {
        return {
            // Grid configuration
            columnDefs: [],
            defaultColDef: {
                flex: 1,
                minWidth: 100,
                resizable: true,
                sortable: true,
                filter: true,
                floatingFilter: false,

                menuTabs: ['filterMenuTab', 'generalMenuTab'],
            },

            // Pagination
            pageSize: 20,

            // Filtering
            quickFilterText: '',
            filteredPokemons: [],
            filteredCount: 0,
            onlyShowCaught: false,
            showAdvancedFilters: false,
            selectedGeneration: '',
            selectedType: '',
            selectedTypes: [],
            idFrom: null,
            idTo: null,

            // Selection
            selectedRows: [],

            // Available filter options
            availableTypes: [
                'normal', 'fire', 'water', 'electric', 'grass', 'ice',
                'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
                'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
            ],

            // AG Grid configurations
            statusBarConfig: {
                statusPanels: [
                    { statusPanel: 'agTotalRowCountComponent', align: 'left' },
                    { statusPanel: 'agFilteredRowCountComponent' },
                    { statusPanel: 'agSelectedRowCountComponent' },
                    { statusPanel: 'agAggregationComponent' }
                ]
            },

            sidebarConfig: {
                toolPanels: [
                    {
                        id: 'columns',
                        labelDefault: 'Columnas',
                        labelKey: 'columns',
                        iconKey: 'columns',
                        toolPanel: 'agColumnsToolPanel',
                        toolPanelParams: {
                            suppressRowGroups: true,
                            suppressValues: true,
                            suppressPivots: true,
                            suppressPivotMode: true,
                            suppressColumnFilter: false,
                            suppressColumnSelectAll: false,
                            suppressColumnExpandAll: false
                        }
                    },
                    {
                        id: 'filters',
                        labelDefault: 'Filtros',
                        labelKey: 'filters',
                        iconKey: 'filter',
                        toolPanel: 'agFiltersToolPanel'
                    }
                ],
                defaultToolPanel: ''
            }
        };
    },
    computed: {
        caughtCount() {
            return this.filteredPokemons.filter(p => this.isCaught(p.id)).length;
        }
    },
    watch: {
        pokemons: {
            handler: 'updateFilteredPokemons',
            immediate: true,
            deep: true
        },
        caughtPokemons: {
            handler: 'updateFilteredPokemons',
            deep: true
        },
        isDarkMode: {
            handler: 'setupColumnDefs',
            immediate: true
        }
    },
    created() {
        this.setupColumnDefs();
    },
    methods: {
        setupColumnDefs() {
            const component = this;
            this.columnDefs = [
                {
                    headerName: '#',
                    field: 'id',
                    filter: 'agNumberColumnFilter',
                    width: 80,
                    pinned: 'left',
                    checkboxSelection: true,
                    headerCheckboxSelection: true,
                    sortable: true,
                    cellStyle: {
                        fontWeight: 'bold',
                        color: this.isDarkMode ? '#d1d5db' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                    },
                    cellRenderer: (params) => {
                        return `#${String(params.value).padStart(3, '0')}`;
                    },
                    filterParams: {
                        buttons: ['reset', 'apply'],
                        closeOnApply: true,
                        filterOptions: ['equals', 'lessThan', 'greaterThan', 'inRange']
                    }
                },
                {
                    headerName: '⚪',
                    field: 'caught',
                    sortable: true,
                    filter: 'agSetColumnFilter',
                    width: 60,
                    cellRenderer: (params) => {
                        const container = document.createElement('div');
                        container.className = 'catch-status-cell-mini';

                        const button = document.createElement('button');
                        button.className = 'mini-catch-btn-small';
                        button.innerHTML = this.isCaught(params.data.id) ? '🔴' : '⚪';
                        button.title = this.isCaught(params.data.id) ? 'Atrapado' : 'No atrapado';

                        button.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.$emit('toggle-caught', params.data);
                        });

                        container.appendChild(button);
                        return container;
                    },
                    valueGetter: (params) => {
                        return this.isCaught(params.data.id) ? 'Atrapado' : 'No atrapado';
                    },
                    filterParams: {
                        values: ['Atrapado', 'No atrapado']
                    }
                },
                {
                    headerName: 'Imagen',
                    field: 'image',
                    sortable: false,
                    filter: false,
                    width: 90,
                    cellRenderer: (params) => {
                        const container = document.createElement('div');
                        container.className = 'pokemon-cell-image-small';

                        if (params.value) {
                            const img = document.createElement('img');
                            img.src = params.value;
                            img.alt = params.data.name || 'Pokemon';
                            img.loading = 'lazy';

                            img.onerror = () => {
                                img.src = this.getFallbackImage(params.data.id);
                            };

                            container.appendChild(img);
                        } else {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'image-placeholder';
                            placeholder.textContent = '?';
                            container.appendChild(placeholder);
                        }

                        return container;
                    }
                },
                {
                    headerName: 'Nombre',
                    field: 'name',
                    filter: 'agTextColumnFilter',
                    width: 140,
                    cellStyle: {
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        fontSize: '13px',
                        color: this.isDarkMode ? '#f9fafb' : '#2c3e50'
                    },
                    cellRenderer: function (params) {
                        const container = document.createElement('div');
                        container.className = 'pokemon-name-cell';

                        const nameSpan = document.createElement('span');
                        nameSpan.textContent = params.value;
                        nameSpan.style.cursor = 'pointer';
                        nameSpan.style.textDecoration = 'underline';
                        nameSpan.title = 'Click para ver detalles';

                        nameSpan.addEventListener('click', (e) => {
                            e.stopPropagation();
                            component.openPokemonModal(params.data);
                        });

                        container.appendChild(nameSpan);
                        return container;
                    },
                    filterParams: {
                        buttons: ['reset', 'apply'],
                        closeOnApply: true,
                        filterOptions: ['contains', 'startsWith', 'endsWith', 'equals']
                    }
                },
                {
                    headerName: 'Tipos',
                    field: 'typesFormatted',
                    filter: 'agSetColumnFilter',
                    width: 170, // Aumentado el ancho para evitar superposición
                    cellRenderer: (params) => {
                        if (params.data.types && params.data.types.length > 0) {
                            const container = document.createElement('div');
                            container.className = 'types-cell-improved';

                            params.data.types.forEach((type, index) => {
                                const badge = document.createElement('span');
                                badge.textContent = type;
                                badge.className = 'type-improved-badge';
                                badge.style.backgroundColor = this.getTypeColor(type);

                                // Añadir margen superior para el segundo tipo para evitar superposición
                                if (index > 0) {
                                    badge.style.marginTop = '2px';
                                }

                                container.appendChild(badge);
                            });

                            return container;
                        }
                        return '';
                    },
                    valueGetter: (params) => {
                        return params.data.types ? params.data.types.join(', ') : '';
                    },
                    filterParams: {
                        values: this.availableTypes
                    }
                },
                {
                    headerName: 'Gen',
                    field: 'generationShort',
                    filter: 'agSetColumnFilter',
                    width: 90,
                    cellStyle: {
                        fontSize: '11px',
                        fontWeight: '500',
                        color: this.isDarkMode ? '#9ca3af' : '#555',
                        textAlign: 'center'
                    },
                    filterParams: {
                        values: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
                    }
                },
                {
                    headerName: 'Altura',
                    field: 'height',
                    filter: 'agNumberColumnFilter',
                    width: 100,
                    cellRenderer: (params) => {
                        return params.value ? `${params.value} m` : '-';
                    },
                    filterParams: {
                        buttons: ['reset', 'apply'],
                        closeOnApply: true
                    }
                },
                {
                    headerName: 'Peso',
                    field: 'weight',
                    filter: 'agNumberColumnFilter',
                    width: 100,
                    cellRenderer: (params) => {
                        return params.value ? `${params.value} kg` : '-';
                    },
                    filterParams: {
                        buttons: ['reset', 'apply'],
                        closeOnApply: true
                    }
                },
                {
                    headerName: 'Stats Base',
                    field: 'baseStatsTotal',
                    filter: 'agNumberColumnFilter',
                    width: 120,
                    cellRenderer: (params) => {
                        const total = params.value || 0;
                        const container = document.createElement('div');
                        const progressBar = document.createElement('div');
                        const text = document.createElement('span');

                        container.className = 'stats-cell';
                        progressBar.className = 'stats-bar';
                        text.textContent = total.toString();

                        const percentage = Math.min((total / 800) * 100, 100);
                        progressBar.style.width = `${percentage}%`;

                        if (total >= 600) progressBar.style.backgroundColor = '#10b981';
                        else if (total >= 500) progressBar.style.backgroundColor = '#f59e0b';
                        else progressBar.style.backgroundColor = '#ef4444';

                        container.appendChild(progressBar);
                        container.appendChild(text);

                        return container;
                    },
                    filterParams: {
                        buttons: ['reset', 'apply'],
                        closeOnApply: true
                    }
                },
                // Columna de Acciones - CORREGIDA
                {
                    headerName: 'Acciones',
                    field: 'actions',
                    sortable: false,
                    filter: false,
                    width: 120,
                    pinned: 'right',
                    cellRenderer: function (params) {
                        const container = document.createElement('div');
                        container.className = 'actions-cell';

                        // Botón para ver detalles
                        const detailsBtn = document.createElement('button');
                        detailsBtn.innerHTML = '👁️';
                        detailsBtn.className = 'action-btn-small details-btn';
                        detailsBtn.title = 'Ver detalles';

                        detailsBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            console.log('[DEBUG] Click en botón de detalles, emitiendo evento con:', params.data);
                            component.$emit('pokemon-selected', params.data);
                        });

                        // Botón para deseleccionar si está seleccionado
                        const isSelected = component.selectedRows.some(row => row.id === params.data.id);
                        if (isSelected) {
                            const deselectBtn = document.createElement('button');
                            deselectBtn.innerHTML = '❌';
                            deselectBtn.className = 'action-btn-small deselect-btn';
                            deselectBtn.title = 'Deseleccionar';
                            deselectBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                component.deselectPokemon(params.data);
                            });
                            container.appendChild(deselectBtn);
                        }

                        container.appendChild(detailsBtn);
                        return container;
                    }
                }
            ];
        },
        openPokemonModal(pokemon) {
            this.$emit('pokemon-selected', pokemon); // 👈 ya lo tienes así conectado
        },
        // Selection methods
        deselectPokemon(pokemon) {
            if (this.$refs.agGrid && this.$refs.agGrid.api) {
                const rowNode = this.$refs.agGrid.api.getRowNode(pokemon.id.toString());
                if (rowNode) {
                    rowNode.setSelected(false);
                }
            }
        },

        // Filtering methods
        updateFilteredPokemons() {
            let filtered = [...this.pokemons];

            // Apply caught filter
            if (this.onlyShowCaught) {
                filtered = filtered.filter(p => this.isCaught(p.id));
            }

            // Apply advanced filters
            if (this.selectedGeneration) {
                filtered = filtered.filter(p => p.generationShort === this.selectedGeneration);
            }

            if (this.selectedType) {
                filtered = filtered.filter(p =>
                    p.types && p.types.some(type => type.toLowerCase() === this.selectedType.toLowerCase())
                );
            }

            if (this.selectedTypes.length > 0) {
                filtered = filtered.filter(p =>
                    p.types && this.selectedTypes.some(selectedType =>
                        p.types.some(pokemonType => pokemonType.toLowerCase() === selectedType.toLowerCase())
                    )
                );
            }

            if (this.idFrom !== null && this.idFrom !== '') {
                filtered = filtered.filter(p => p.id >= this.idFrom);
            }

            if (this.idTo !== null && this.idTo !== '') {
                filtered = filtered.filter(p => p.id <= this.idTo);
            }

            // Apply quick filter
            if (this.quickFilterText) {
                const searchTerm = this.quickFilterText.toLowerCase();
                filtered = filtered.filter(p =>
                    p.name.toLowerCase().includes(searchTerm) ||
                    p.id.toString().includes(searchTerm) ||
                    (p.types && p.types.some(type => type.toLowerCase().includes(searchTerm)))
                );
            }

            this.filteredPokemons = filtered;
            this.filteredCount = filtered.length;
        },

        onQuickFilterChanged() {
            this.updateFilteredPokemons();
        },

        toggleCaughtFilter() {
            this.onlyShowCaught = !this.onlyShowCaught;
            this.updateFilteredPokemons();
        },

        toggleAdvancedFilters() {
            this.showAdvancedFilters = !this.showAdvancedFilters;
        },

        applyAdvancedFilters() {
            this.updateFilteredPokemons();
        },

        toggleTypeFilter(type) {
            const index = this.selectedTypes.indexOf(type);
            if (index > -1) {
                this.selectedTypes.splice(index, 1);
            } else {
                this.selectedTypes.push(type);
            }
            this.updateFilteredPokemons();
        },

        clearAllFilters() {
            this.quickFilterText = '';
            this.onlyShowCaught = false;
            this.selectedGeneration = '';
            this.selectedType = '';
            this.selectedTypes = [];
            this.idFrom = null;
            this.idTo = null;

            // Clear AG Grid filters
            if (this.$refs.agGrid && this.$refs.agGrid.api) {
                this.$refs.agGrid.api.setFilterModel(null);
            }

            this.updateFilteredPokemons();
        },

        // Event handlers
        onCellClicked(event) {
            if (!event || !event.data || !event.colDef) {
                return;
            }

            if (event.colDef.field === 'caught' || event.colDef.field === 'actions') {
                return;
            }

            this.$emit('cell-clicked', {
                pokemon: event.data,
                column: event.colDef.field,
                event: event
            });
        },

        onRowClicked(event) {
            this.$emit('row-clicked', {
                pokemon: event.data,
                event: event
            });
        },

        onRowDoubleClicked(event) {
            this.openPokemonModal(event.data);
            this.$emit('row-double-clicked', {
                pokemon: event.data,
                event: event
            });
        },

        onCellDoubleClicked(event) {
            if (event.colDef.field !== 'caught' && event.colDef.field !== 'actions') {
                this.openPokemonModal(event.data);
            }
        },

        onSelectionChanged(event) {
            this.selectedRows = event.api.getSelectedRows();
            this.$emit('selection-changed', {
                selectedPokemons: this.selectedRows,
                count: this.selectedRows.length
            });
        },

        onSortChanged() {
            const api = this.$refs.agGrid?.api;
            if (api && typeof api.getSortModel === 'function') {
                const sortModel = api.getSortModel();
                this.$emit('sort-changed', sortModel);
            }
        },


        onFilterChanged(event) {
            const filterModel = event.api.getFilterModel();
            this.$emit('filter-changed', filterModel);
        },

        onPaginationChanged(event) {
            const currentPage = event.api.paginationGetCurrentPage();
            const totalPages = event.api.paginationGetTotalPages();
            this.$emit('pagination-changed', {
                currentPage: currentPage + 1,
                totalPages,
                pageSize: this.pageSize
            });
        },

        onPageSizeChanged() {
            if (this.$refs.agGrid && this.$refs.agGrid.api) {
                this.$refs.agGrid.api.paginationSetPageSize(Number(this.pageSize));
            }
        },

        // Selection actions
        markSelectedAsCaught() {
            this.selectedRows.forEach(pokemon => {
                this.$emit('toggle-caught', pokemon);
            });
            this.clearSelection();
        },

        markSelectedAsNotCaught() {
            this.selectedRows.forEach(pokemon => {
                if (this.isCaught(pokemon.id)) {
                    this.$emit('toggle-caught', pokemon);
                }
            });
            this.clearSelection();
        },

        exportSelected() {
            const csvContent = this.generateCSV(this.selectedRows);
            this.downloadCSV(csvContent, 'pokemon-seleccionados.csv');
        },

        clearSelection() {
            if (this.$refs.agGrid && this.$refs.agGrid.api) {
                this.$refs.agGrid.api.deselectAll();
            }
        },

        // Context menu
        getContextMenuItems(params) {
            const pokemon = params.node.data;
            const isCaught = this.isCaught(pokemon.id);
            const isSelected = this.selectedRows.some(row => row.id === pokemon.id);

            const menuItems = [
                {
                    name: `Ver detalles de ${pokemon.name}`,
                    action: () => this.openPokemonModal(pokemon),
                    icon: '<span>👁️</span>'
                },
                'separator',
                {
                    name: isCaught ? 'Marcar como no atrapado' : 'Marcar como atrapado',
                    action: () => this.$emit('toggle-caught', pokemon),
                    icon: isCaught ? '<span>⚪</span>' : '<span>🔴</span>'
                }
            ];

            if (isSelected) {
                menuItems.push({
                    name: 'Deseleccionar',
                    action: () => this.deselectPokemon(pokemon),
                    icon: '<span>❌</span>'
                });
            }

            menuItems.push(
                'separator',
                {
                    name: 'Copiar nombre',
                    action: () => navigator.clipboard.writeText(pokemon.name),
                    icon: '<span>📋</span>'
                },
                {
                    name: 'Copiar ID',
                    action: () => navigator.clipboard.writeText(pokemon.id.toString()),
                    icon: '<span>📋</span>'
                },
                'separator',
                'export'
            );

            return menuItems;
        },

        // Utility methods
        isCaught(pokemonId) {
            return this.caughtPokemons.has(pokemonId);
        },

        getFallbackImage(pokemonId) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
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

        generateCSV(data) {
            const headers = ['ID', 'Nombre', 'Tipos', 'Generación', 'Atrapado'];
            const rows = data.map(pokemon => [
                pokemon.id,
                pokemon.name,
                pokemon.types ? pokemon.types.join(', ') : '',
                pokemon.generationShort || '',
                this.isCaught(pokemon.id) ? 'Sí' : 'No'
            ]);

            return [headers, ...rows]
                .map(row => row.map(cell => `"${cell}"`).join(','))
                .join('\n');
        },

        downloadCSV(csvContent, filename) {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};
</script>

<style scoped>
/* Variables CSS */
.pokemon-grid {
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

/* Dark theme */
.pokemon-grid:has(.ag-theme-alpine-dark) {
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

/* Loading */
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
    background: linear-gradient(to bottom,
            #dc2626 0%,
            #dc2626 45%,
            #1f2937 45%,
            #1f2937 55%,
            #f8fafc 55%,
            #f8fafc 100%);
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
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* Controls Bar */
.controls-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-secondary);
    padding: 1rem;
    border-radius: var(--radius-lg);
    margin-bottom: 1rem;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
}

.search-container {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 300px;
}

.search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: all 0.2s ease;
}

.search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 1rem;
}

.filter-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.filter-btn {
    padding: 0.5rem 1rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.filter-btn:hover {
    background: var(--bg-tertiary);
    transform: translateY(-1px);
}

.filter-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.view-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

.page-size-select {
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.875rem;
    cursor: pointer;
}

.stats {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
}

.stat-item {
    color: var(--text-secondary);
    white-space: nowrap;
}

.stat-item strong {
    color: var(--text-primary);
    font-weight: 600;
}

/* Advanced Filters */
.advanced-filters {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: var(--shadow-md);
}

.filter-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
}

.filter-row:last-child {
    margin-bottom: 0;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 150px;
}

.filter-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
}

.filter-group select,
.filter-group .number-input {
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.875rem;
}

.filter-group select:focus,
.filter-group .number-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.type-badges {
    flex: 1;
    min-width: 100%;
}

.type-filter-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.type-filter-badge {
    padding: 0.25rem 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: 1rem;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: capitalize;
}

.type-filter-badge:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
}

.type-filter-badge.active {
    color: white;
    border-color: transparent;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Selection Info */
.selection-info {
    background: linear-gradient(135deg, var(--primary-color), var(--info-color));
    color: white;
    padding: 1rem;
    border-radius: var(--radius-lg);
    margin-bottom: 1rem;
    box-shadow: var(--shadow-lg);
}

.selection-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.selection-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.action-btn {
    padding: 0.5rem 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    backdrop-filter: blur(10px);
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.catch-btn:hover {
    background: var(--success-color);
    border-color: var(--success-color);
}

.release-btn:hover {
    background: var(--text-muted);
    border-color: var(--text-muted);
}

.export-btn:hover {
    background: var(--warning-color);
    border-color: var(--warning-color);
}

.clear-btn:hover {
    background: var(--danger-color);
    border-color: var(--danger-color);
}

/* Grid */
.pokemon-grid {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    overflow: hidden;
    border: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 9999;
    /* 👈 Asegura que esté encima del ag-grid */
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Grid cell styles */
:deep(.pokemon-cell-image-small) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
}

:deep(.pokemon-cell-image-small img) {
    width: 50px;
    height: 50px;
    object-fit: contain;
    border-radius: var(--radius-md);
    transition: transform 0.2s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

:deep(.pokemon-cell-image-small img:hover) {
    transform: scale(1.1);
}

:deep(.image-placeholder) {
    width: 50px;
    height: 50px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-weight: bold;
    font-size: 20px;
}

:deep(.types-cell-mini) {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: center;
}

:deep(.type-mini-badge) {
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.catch-status-cell-mini) {
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.mini-catch-btn-small) {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    padding: 4px;
    border-radius: 50%;
    transition: all 0.2s ease;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.mini-catch-btn-small:hover) {
    background: var(--bg-tertiary);
    transform: scale(1.1);
}

:deep(.stats-cell) {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 8px;
}

:deep(.stats-bar) {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    opacity: 0.3;
    transition: all 0.3s ease;
}

:deep(.stats-cell span) {
    position: relative;
    z-index: 1;
    font-weight: 600;
    font-size: 12px;
}

/* AG Grid customization */
:deep(.ag-theme-alpine) {
    --ag-background-color: var(--bg-primary);
    --ag-header-background-color: var(--bg-secondary);
    --ag-odd-row-background-color: var(--bg-primary);
    --ag-even-row-background-color: var(--bg-secondary);
    --ag-row-hover-color: var(--bg-tertiary);
    --ag-border-color: var(--border-color);
    --ag-header-foreground-color: var(--text-primary);
    --ag-data-color: var(--text-primary);
    --ag-font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --ag-selected-row-background-color: rgba(59, 130, 246, 0.1);
    --ag-range-selection-background-color: rgba(59, 130, 246, 0.2);
}

:deep(.ag-theme-alpine-dark) {
    --ag-background-color: var(--bg-primary);
    --ag-header-background-color: var(--bg-secondary);
    --ag-odd-row-background-color: var(--bg-primary);
    --ag-even-row-background-color: rgba(30, 41, 59, 0.5);
    --ag-row-hover-color: var(--bg-tertiary);
    --ag-border-color: var(--border-color);
    --ag-header-foreground-color: var(--text-primary);
    --ag-data-color: var(--text-primary);
    --ag-selected-row-background-color: rgba(59, 130, 246, 0.2);
    --ag-range-selection-background-color: rgba(59, 130, 246, 0.3);
}

:deep(.ag-header-cell) {
    font-weight: 600;
    font-size: 0.875rem;
    border-bottom: 2px solid var(--primary-color);
}

:deep(.ag-row) {
    cursor: pointer;
    transition: all 0.2s ease;
}

:deep(.ag-row:hover) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}

:deep(.ag-row.ag-row-selected) {
    background: var(--ag-selected-row-background-color) !important;
    border-left: 4px solid var(--primary-color);
}

:deep(.ag-cell) {
    display: flex;
    align-items: center;
    border-right: 1px solid var(--border-color);
}

:deep(.ag-paging-panel) {
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    padding: 1rem;
}

:deep(.ag-status-bar) {
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-size: 0.875rem;
}

:deep(.ag-side-bar) {
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
}

:deep(.ag-tool-panel-wrapper) {
    background: var(--bg-primary);
}

/* Context menu */
:deep(.ag-menu) {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
}

:deep(.ag-menu-option) {
    color: var(--text-primary);
    padding: 0.75rem 1rem;
}

:deep(.ag-menu-option:hover) {
    background: var(--bg-tertiary);
}

/* Responsive */
@media (max-width: 480px) {
    .controls-bar {
        flex-direction: column;
        align-items: stretch;
    }

    .search-container {
        width: 100% !important;
        max-width: 100% !important;
    }

    .search-input {
        width: 100% !important;
        box-sizing: border-box;
    }

    .view-controls {
        justify-content: space-between;
    }
}

@media (max-width: 768px) {
    .pokemon-grid {
        margin: 0;
        border-radius: var(--radius-md);
    }

    .controls-bar {
        padding: 1rem 0.5rem;
    }

    .advanced-filters {
        padding: 1rem;
    }

    .filter-row {
        flex-direction: column;
    }

    .filter-group {
        min-width: auto;
    }

    .selection-content {
        flex-direction: column;
        align-items: stretch;
    }

    .selection-actions {
        justify-content: center;
    }

    :deep(.pokemon-cell-image-small img) {
        width: 40px;
        height: 40px;
    }

    :deep(.image-placeholder) {
        width: 40px;
        height: 40px;
        font-size: 16px;
    }

    :deep(.ag-side-bar) {
        display: none;
    }
}

@media (max-width: 768px) {
    .controls-bar {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-buttons,
    .view-controls {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
    }

    .filter-btn,
    .page-size-select {
        width: 100%;
    }

    .stats {
        flex-direction: column;
        align-items: center;
    }

    .search-container {
        width: 100%;
        max-width: none;
    }

    .pokemon-grid.dark-mode {
        background-color: var(--bg-primary);
        color: var(--text-primary);
    }
}

:deep(.ag-theme-alpine-dark) {
    background-color: #0f172a !important;
    --ag-background-color: #0f172a;
    --ag-foreground-color: #f8fafc;
    --ag-header-background-color: #1e293b;
    --ag-header-foreground-color: #f8fafc;
    --ag-data-color: #f8fafc;
    --ag-border-color: #334155;
    --ag-row-hover-color: #1e293b;
    --ag-selected-row-background-color: rgba(59, 130, 246, 0.2);
    --ag-font-size: 13px;
    --ag-font-family: 'Segoe UI', sans-serif;
}

:deep(.ag-theme-alpine-dark .ag-header-cell-label) {
    color: #f8fafc !important;
}

:deep(.ag-theme-alpine-dark .ag-cell) {
    color: #f8fafc !important;
    background-color: transparent !important;
}

:deep(.full-dark-grid .ag-row) {
    background-color: #0f172a !important;
}

:deep(.full-dark-grid .ag-row:hover) {
    background-color: #1e293b !important;
}
</style>