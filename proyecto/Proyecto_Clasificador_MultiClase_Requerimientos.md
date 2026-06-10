# Proyecto Final — Clasificador Multi-Clase

**Curso de Machine Learning — Universidad Galileo 2026**

---

## 1. Objetivo

Construir un sistema de **clasificación multi-clase** (mínimo **3 clases**) entrenando, comparando y ensamblando tres familias de modelos distintas. El proyecto evalúa tu capacidad de:

- Diseñar y registrar **experimentos** de forma sistemática y reproducible.
- Comparar modelos con métricas consistentes (precision, recall, F1, accuracy).
- Diagnosticar **underfit / overfit** comparando desempeño en train vs test.
- Combinar modelos en un **ensamble** y razonar sobre el resultado.

> **Importante:** Este es un problema de clasificación **multi-clase**, no binario. El dataset elegido debe tener **al menos 3 clases** en la variable objetivo.

---

## 2. Elección del dataset

Debes elegir **uno** de los siguientes **5 datasets candidatos**. Todos son tabulares, multi-clase y de dificultad apropiada. **Queda prohibido usar MNIST** (ni Fashion-MNIST ni variantes de dígitos de imágenes).

> Una vez elegido, indícalo claramente en la primera celda del notebook/reporte y justifica brevemente por qué lo escogiste.

| # | Dataset | Clases | Features | Instancias | Descarga / Ubicación |
|---|---------|--------|----------|------------|----------------------|
| 1 | **Wine** | 3 | 13 | 178 | `from sklearn.datasets import load_wine` → `load_wine(as_frame=True)`. Incluido en scikit-learn, no requiere descarga. |
| 2 | **Palmer Penguins** | 3 (especies) | ~7 | 344 | `pip install palmerpenguins` → `from palmerpenguins import load_penguins; df = load_penguins()`. Alternativa: `seaborn.load_dataset("penguins")`. CSV directo: https://raw.githubusercontent.com/allisonhorst/palmerpenguins/main/inst/extdata/penguins.csv |
| 3 | **Dry Bean Dataset** | 7 (variedades de frijol) | 16 | 13,611 | UCI ML Repository (ID 602): https://archive.ics.uci.edu/dataset/602/dry+bean+dataset — descargar el `.xlsx`. O vía `ucimlrepo`: `pip install ucimlrepo` → `from ucimlrepo import fetch_ucirepo; ds = fetch_ucirepo(id=602)`. |
| 4 | **Forest Cover Type** | 7 (tipos de bosque) | 54 | 581,012 | `from sklearn.datasets import fetch_covtype` → `fetch_covtype(as_frame=True)` (descarga automática la primera vez). UCI ID 31: https://archive.ics.uci.edu/dataset/31/covertype |
| 5 | **Human Activity Recognition (HAR) Using Smartphones** | 6 (actividades) | 561 | 10,299 | UCI ID 240: https://archive.ics.uci.edu/dataset/240/human+activity+recognition+using+smartphones — descargar ZIP con archivos `train/` y `test/`. O vía `ucimlrepo` (`fetch_ucirepo(id=240)`). |

**Recomendaciones por nivel:**
- *Más sencillo / rápido:* Wine o Palmer Penguins (datasets pequeños, ideales para iterar rápido).
- *Intermedio:* Dry Bean (más datos, clases balanceadas-ish, buen reto de feature importance).
- *Más exigente:* Forest Cover Type (muy grande, conviene submuestrear) o HAR (alta dimensionalidad, 561 features).

> Si el dataset tiene valores faltantes (p. ej. Penguins) o variables categóricas, debes manejarlos (imputación, encoding) y documentar la decisión.

---

## 3. Preparación de datos

1. Carga y exploración mínima (shape, distribución de clases, nulos).
2. Limpieza: manejo de nulos, encoding de categóricas, escalado si el modelo lo requiere (la red neuronal típicamente sí; los árboles no).
3. **Split único train-test** (sugerido 70/30 u 80/20), estratificado por clase (`stratify=y`).

> **Restricción obligatoria:** Solo se permite **train-test split**. **NO uses cross-validation** (ni `cross_val_score`, ni `GridSearchCV` con CV, ni `KFold`). Todos los experimentos y la selección del mejor modelo se reportan sobre el **mismo test split**.

Usa una `random_state` fija para que el split sea reproducible.

---

## 4. Modelos a implementar

Debes implementar **tres familias de modelos**:

1. **Random Forest** (`sklearn.ensemble.RandomForestClassifier`)
2. **XGBoost** (`xgboost.XGBClassifier`)
3. **Red Neuronal** (TensorFlow/Keras o PyTorch — tu elección)

### 4.1 Experimentos por modelo

Por **cada uno de los 3 modelos** debes ejecutar **al menos 5 experimentos**, variando hiperparámetros y/o arquitectura. Ejemplos de qué variar:

- **Random Forest:** `n_estimators`, `max_depth`, `min_samples_leaf`, `max_features`, `criterion`.
- **XGBoost:** `n_estimators`, `max_depth`, `learning_rate`, `subsample`, `colsample_bytree`, `reg_lambda`.
- **Red Neuronal:** número de capas, neuronas por capa, función de activación, `learning_rate`, `batch_size`, `epochs`, dropout/regularización.

Para cada experimento, calcula las métricas en **train** y en **test**.

### 4.2 Selección del mejor por familia

De los ≥5 experimentos de cada familia, elige el **mejor modelo según el F1-score máximo en el test split** (usa `f1_score(..., average='macro')` o `'weighted'` — indica cuál usas y sé consistente). Al final tendrás **3 "mejores modelos"**, uno por familia.

### 4.3 Feature importance (solo Random Forest)

Para el **mejor Random Forest**, realiza un **análisis de feature importance**:
- Extrae `feature_importances_`.
- Grafica las importancias ordenadas (bar chart).
- Comenta cuáles features dominan la decisión y si el resultado tiene sentido respecto al dominio del problema.

---

## 5. Bitácora de experimentos (CSV)

Debes generar un archivo **`bitacora_experimentos.csv`** que registre **todos** los experimentos (los ≥15 en total: ≥5 por familia). Cada fila = un experimento.

**Columnas mínimas requeridas:**

| Columna | Descripción |
|---------|-------------|
| `experimento_id` | Identificador único (p. ej. `RF_01`, `XGB_03`, `NN_05`). |
| `modelo` | Familia: `random_forest`, `xgboost` o `neural_network`. |
| `hiperparametros` | Hiperparámetros usados (string/JSON, p. ej. `{"n_estimators":200,"max_depth":10}`). |
| `arquitectura` | Para la NN: descripción de capas (p. ej. `[64, relu, 32, relu, softmax]`). Para árboles puede ir vacío o repetir hiperparámetros clave. |
| `precision` | Precision en **test** (macro o weighted; sé consistente). |
| `recall` | Recall en **test**. |
| `f1` | F1-score en **test**. |
| `accuracy` | Accuracy en **test**. |
| `f1_train` | F1-score en **train** (para diagnóstico de overfit). |

> Puedes agregar columnas extra (tiempo de entrenamiento, `precision_train`, etc.), pero las anteriores son obligatorias. El CSV debe generarse desde el código (p. ej. acumulando un `pandas.DataFrame` y haciendo `df.to_csv(...)`), **no a mano**.

---

## 6. Ensamble (majority voting con bootstrap)

Construye un **ensamble de tipo majority voting** combinando los **3 mejores modelos** (uno por familia, los seleccionados en 4.2).

Requisitos:
- El ensamble predice la clase por **voto mayoritario** entre los 3 modelos.
- Cada modelo base se entrena sobre una **muestra bootstrap** (muestreo con reemplazo del train set). Es decir, generas 3 réplicas bootstrap del conjunto de entrenamiento y entrenas cada mejor-modelo en su propia muestra.
- En caso de empate (las 3 clases distintas), define y documenta una regla de desempate (p. ej. la clase del modelo con mayor F1 individual).

> Puedes implementarlo manualmente (entrenar cada modelo en su bootstrap y combinar predicciones con `scipy.stats.mode`) o apoyarte en utilidades, siempre que cumplas: **bootstrap por modelo + voto mayoritario**.

Evalúa el ensamble final en **train** y en **test**.

---

## 7. Comparación final y diagnóstico

Presenta una **tabla comparativa** de **F1-score en train vs test** para **4 modelos**: los 3 mejores (uno por familia) + el ensamble.

| Modelo | F1 (train) | F1 (test) | Diagnóstico |
|--------|-----------|-----------|-------------|
| Mejor Random Forest | … | … | underfit / overfit / bien |
| Mejor XGBoost | … | … | underfit / overfit / bien |
| Mejor Red Neuronal | … | … | underfit / overfit / bien |
| Ensamble (majority voting) | … | … | underfit / overfit / bien |

Para **cada modelo**, agrega una **nota de diagnóstico** indicando si presenta:
- **Underfitting:** F1 bajo tanto en train como en test (el modelo no aprende).
- **Overfitting:** F1 alto en train pero notablemente más bajo en test (memoriza, no generaliza).
- **Buen ajuste:** F1 alto y similar en train y test.

Justifica brevemente cada diagnóstico con los números.

---

## 8. Entregables

1. **Notebook** (`.ipynb`) con todo el código: carga de datos, preparación, experimentos, feature importance, ensamble y comparación final.
2. **`bitacora_experimentos.csv`** generado por el código.
3. Gráfico de **feature importance** del mejor Random Forest.
4. **Tabla comparativa final** (sección 7) con notas de diagnóstico.
5. Breve **conclusión** (5–10 líneas): qué familia funcionó mejor, si el ensamble mejoró o no, y qué aprendiste.

---

## 9. Rúbrica sugerida (100 pts)

| Criterio | Pts |
|----------|-----|
| Elección y preparación correcta del dataset (multi-clase, split estratificado, sin CV) | 10 |
| ≥5 experimentos por familia (≥15 total) bien parametrizados | 25 |
| Bitácora CSV completa con todas las columnas requeridas | 15 |
| Feature importance analysis del Random Forest | 10 |
| Selección correcta del mejor modelo por F1 máximo en test | 10 |
| Ensamble majority voting con bootstrap correctamente implementado | 15 |
| Tabla comparativa train vs test + diagnóstico underfit/overfit/bien | 10 |
| Conclusión y calidad general del reporte | 5 |

---

## 10. Reglas y restricciones (resumen)

- ✅ Clasificación **multi-clase** (≥3 clases).
- ✅ Dataset elegido de la lista de 5 (sección 2).
- ❌ **Prohibido MNIST** y variantes de imágenes de dígitos.
- ✅ Tres familias: **Random Forest, XGBoost, Red Neuronal**.
- ✅ **≥5 experimentos por familia**, mejor modelo por **F1 máximo en test**.
- ✅ Solo **train-test split**. ❌ **Sin cross-validation**.
- ✅ Feature importance **solo** para Random Forest.
- ✅ Ensamble **majority voting** con **muestreo bootstrap**.
- ✅ Comparar **F1 train vs test** de los 3 mejores + ensamble, con nota de diagnóstico.
- ✅ Bitácora **CSV** con precision, recall, F1, accuracy + hiperparámetros + arquitectura.
