package algorithm

import (
	"sort"
	"testing"

	"github.com/coworking/space-service/internal/models"
)

func getTestSpaces() []models.Espacio {
	return []models.Espacio{
		{ID: 1, Nombre: "Sala de Juntas VIP"},
		{ID: 2, Nombre: "Escritorio Compartido A"},
		{ID: 3, Nombre: "Oficina Privada Ejecutiva"},
		{ID: 4, Nombre: "Sala de Conferencias Grande"},
		{ID: 5, Nombre: "Escritorio Compartido B"},
	}
}

func TestBusquedaLineal(t *testing.T) {
	espacios := getTestSpaces()

	// Prueba 1: Búsqueda exacta y parcial
	res1 := BusquedaLineal(espacios, "compartido")
	if len(res1) != 2 {
		t.Errorf("Esperado 2 espacios con 'compartido', obtenido %d", len(res1))
	}

	// Prueba 2: Búsqueda sin coincidencias
	res2 := BusquedaLineal(espacios, "inexistente")
	if len(res2) != 0 {
		t.Errorf("Esperado 0 espacios para 'inexistente', obtenido %d", len(res2))
	}

	// Prueba 3: Insensibilidad a mayúsculas/minúsculas
	res3 := BusquedaLineal(espacios, "vIp")
	if len(res3) != 1 || res3[0].Nombre != "Sala de Juntas VIP" {
		t.Errorf("Esperado 'Sala de Juntas VIP', obtenido %+v", res3)
	}
}

func TestBusquedaBinaria(t *testing.T) {
	espacios := getTestSpaces()

	// Prueba 1: Búsqueda exacta y parcial
	res1 := BusquedaBinaria(espacios, "compartido")
	if len(res1) != 2 {
		t.Errorf("Esperado 2 espacios con 'compartido', obtenido %d", len(res1))
	}

	// Prueba 2: Búsqueda sin coincidencias
	res2 := BusquedaBinaria(espacios, "inexistente")
	if len(res2) != 0 {
		t.Errorf("Esperado 0 espacios para 'inexistente', obtenido %d", len(res2))
	}

	// Prueba 3: Insensibilidad a mayúsculas/minúsculas
	res3 := BusquedaBinaria(espacios, "vIp")
	if len(res3) != 1 || res3[0].Nombre != "Sala de Juntas VIP" {
		t.Errorf("Esperado 'Sala de Juntas VIP', obtenido %+v", res3)
	}
}

func TestComparacionDeAlgoritmos(t *testing.T) {
	espacios := getTestSpaces()
	termino := "escritorio"

	resLineal := BusquedaLineal(espacios, termino)
	resBinaria := BusquedaBinaria(espacios, termino)

	if len(resLineal) != len(resBinaria) {
		t.Fatalf("Los resultados difieren en tamaño: Lineal(%d) vs Binaria(%d)", len(resLineal), len(resBinaria))
	}

	// Ordenamos ambos resultados por ID para comparar los elementos
	sort.Slice(resLineal, func(i, j int) bool { return resLineal[i].ID < resLineal[j].ID })
	sort.Slice(resBinaria, func(i, j int) bool { return resBinaria[i].ID < resBinaria[j].ID })

	for i := range resLineal {
		if resLineal[i].ID != resBinaria[i].ID {
			t.Errorf("Discrepancia en el índice %d: Lineal ID %d != Binaria ID %d", i, resLineal[i].ID, resBinaria[i].ID)
		}
	}
}
