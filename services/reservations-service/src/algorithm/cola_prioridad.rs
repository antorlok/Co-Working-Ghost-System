use crate::models::reserva::Reserva;

/// Min-heap priority queue: lower `prioridad` value = higher urgency (1 = URGENTE first).
#[derive(Debug, Default)]
pub struct ColaPrioridad {
    heap: Vec<Reserva>,
}

impl ColaPrioridad {
    pub fn new() -> Self {
        Self { heap: Vec::new() }
    }

    pub fn insertar(&mut self, reserva: Reserva) {
        self.heap.push(reserva);
        self.subir_ultimo();
    }

    pub fn extraer_max(&mut self) -> Option<Reserva> {
        if self.heap.is_empty() {
            return None;
        }
        if self.heap.len() == 1 {
            return self.heap.pop();
        }

        let raiz = self.heap[0].clone();
        let last = self.heap.pop().expect("heap non-empty");
        self.heap[0] = last;
        self.bajar_raiz();
        Some(raiz)
    }

    pub fn ver_siguiente(&self) -> Option<&Reserva> {
        self.heap.first()
    }

    pub fn ver_cola(&self) -> Vec<Reserva> {
        let mut copia = self.heap.clone();
        copia.sort_by(|a, b| a.prioridad.cmp(&b.prioridad));
        copia
    }

    pub fn tamanio(&self) -> usize {
        self.heap.len()
    }

    pub fn esta_vacia(&self) -> bool {
        self.heap.is_empty()
    }

    fn subir_ultimo(&mut self) {
        let mut i = self.heap.len() - 1;
        while i > 0 {
            let padre = (i - 1) / 2;
            if self.heap[i].prioridad < self.heap[padre].prioridad {
                self.intercambiar(i, padre);
                i = padre;
            } else {
                break;
            }
        }
    }

    fn bajar_raiz(&mut self) {
        let mut i = 0;
        let n = self.heap.len();
        loop {
            let mut menor_idx = i;
            let izq = 2 * i + 1;
            let der = 2 * i + 2;

            if izq < n && self.heap[izq].prioridad < self.heap[menor_idx].prioridad {
                menor_idx = izq;
            }
            if der < n && self.heap[der].prioridad < self.heap[menor_idx].prioridad {
                menor_idx = der;
            }
            if menor_idx == i {
                break;
            }
            self.intercambiar(i, menor_idx);
            i = menor_idx;
        }
    }

    fn intercambiar(&mut self, i: usize, j: usize) {
        self.heap.swap(i, j);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use crate::models::reserva::EstadoReserva;

    fn reserva(id: i64, prioridad: i32) -> Reserva {
        let now = Utc::now();
        Reserva {
            id,
            usuario_id: 1,
            espacio_id: 1,
            nombre_espacio: None,
            fecha_inicio: now,
            fecha_fin: now,
            estado: EstadoReserva::Pendiente,
            prioridad,
            creado_en: now,
            notas: None,
        }
    }

    #[test]
    fn extrae_menor_prioridad_primero() {
        let mut cola = ColaPrioridad::new();
        cola.insertar(reserva(1, 3));
        cola.insertar(reserva(2, 1));
        cola.insertar(reserva(3, 2));

        assert_eq!(cola.extraer_max().unwrap().id, 2);
        assert_eq!(cola.extraer_max().unwrap().id, 3);
        assert_eq!(cola.extraer_max().unwrap().id, 1);
        assert!(cola.extraer_max().is_none());
    }

    #[test]
    fn heap_vacio_no_devuelve_elementos() {
        let mut cola = ColaPrioridad::new();
        assert!(cola.esta_vacia());
        assert_eq!(cola.tamanio(), 0);
        assert!(cola.ver_siguiente().is_none());
        assert!(cola.extraer_max().is_none());
        assert!(cola.ver_cola().is_empty());
    }

    #[test]
    fn un_solo_elemento_insertar_y_extraer() {
        let mut cola = ColaPrioridad::new();
        cola.insertar(reserva(42, 2));
        assert_eq!(cola.tamanio(), 1);
        assert_eq!(cola.ver_siguiente().unwrap().id, 42);
        assert_eq!(cola.extraer_max().unwrap().id, 42);
        assert!(cola.esta_vacia());
    }

    #[test]
    fn ver_siguiente_es_el_mas_urgente_sin_extraer() {
        let mut cola = ColaPrioridad::new();
        cola.insertar(reserva(10, 3));
        cola.insertar(reserva(20, 1));

        assert_eq!(cola.ver_siguiente().unwrap().id, 20);
        assert_eq!(cola.tamanio(), 2);
        assert_eq!(cola.extraer_max().unwrap().id, 20);
    }

    #[test]
    fn ver_cola_ordenada_por_prioridad_ascendente() {
        let mut cola = ColaPrioridad::new();
        cola.insertar(reserva(1, 3));
        cola.insertar(reserva(2, 1));
        cola.insertar(reserva(3, 2));

        let ids: Vec<i64> = cola.ver_cola().into_iter().map(|r| r.id).collect();
        assert_eq!(ids, vec![2, 3, 1]);
    }

    #[test]
    fn empate_prioridad_mantiene_alguno_en_raiz() {
        let mut cola = ColaPrioridad::new();
        cola.insertar(reserva(100, 2));
        cola.insertar(reserva(200, 2));

        let primero = cola.extraer_max().unwrap().id;
        let segundo = cola.extraer_max().unwrap().id;
        assert!(primero == 100 || primero == 200);
        assert!(segundo == 100 || segundo == 200);
        assert_ne!(primero, segundo);
    }
}
