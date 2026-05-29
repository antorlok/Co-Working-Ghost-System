package algorithm

import (
	"sort"
	"strings"

	"github.com/coworking/space-service/internal/models"
)

// BusquedaLineal realiza una búsqueda secuencial en memoria de los espacios.
// Complejidad temporal: O(n) donde n es el número de elementos.
// Recorre uno por uno todos los elementos y compara de forma insensible a mayúsculas/minúsculas.
func BusquedaLineal(espacios []models.Espacio, query string) []models.Espacio {
	query = strings.ToLower(query)
	var resultado []models.Espacio

	for _, e := range espacios {
		// Compara si el término buscado está contenido en el nombre del espacio
		if strings.Contains(strings.ToLower(e.Nombre), query) {
			resultado = append(resultado, e)
		}
	}
	return resultado
}

// BusquedaBinaria realiza una búsqueda binaria eficiente en memoria.
// Complejidad temporal: O(log n) para la búsqueda (requiere ordenamiento previo de O(n log n)).
// Requisito fundamental: La colección DEBE estar ordenada previamente por el criterio de búsqueda (Nombre).
func BusquedaBinaria(espacios []models.Espacio, query string) []models.Espacio {
	if len(espacios) == 0 {
		return []models.Espacio{}
	}

	// 1. Clonamos el slice recibido para evitar efectos secundarios u ordenar la lista original (inmutabilidad)
	copia := make([]models.Espacio, len(espacios))
	copy(copia, espacios)

	// 2. Ordenamos alfabéticamente por nombre de forma ascendente
	sort.Slice(copia, func(i, j int) bool {
		return strings.ToLower(copia[i].Nombre) < strings.ToLower(copia[j].Nombre)
	})

	query = strings.ToLower(query)
	var resultado []models.Espacio

	bajo := 0
	alto := len(copia) - 1

	// 3. Bucle clásico de Búsqueda Binaria dividiendo el espacio a la mitad en cada paso
	for bajo <= alto {
		medio := bajo + (alto-bajo)/2
		nombreMedio := strings.ToLower(copia[medio].Nombre)

		// Si el elemento medio contiene el término, se recolectan los resultados
		if strings.Contains(nombreMedio, query) {
			resultado = append(resultado, copia[medio])

			// Como el slice está ordenado, los elementos que coinciden parcialmente
			// pueden estar ubicados adyacentes a la posición actual.
			
			// Escanear hacia la izquierda
			izq := medio - 1
			for izq >= 0 && strings.Contains(strings.ToLower(copia[izq].Nombre), query) {
				resultado = append(resultado, copia[izq])
				izq--
			}

			// Escanear hacia la derecha
			der := medio + 1
			for der < len(copia) && strings.Contains(strings.ToLower(copia[der].Nombre), query) {
				resultado = append(resultado, copia[der])
				der++
			}
			break
		}

		// Si el nombre medio es menor que el término, descartamos la mitad izquierda
		if nombreMedio < query {
			bajo = medio + 1
		} else { // De lo contrario, descartamos la mitad derecha
			alto = medio - 1
		}
	}

	return resultado
}
