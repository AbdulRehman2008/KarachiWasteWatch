# Phase 1: Dataset & Labeling Guide (Karachi WasteWatch AI)

## 1. Objective
Create a clean, well-structured dataset in **YOLO format** for detecting waste in Karachi's civic environments (roads, alleys, overflowing dumpsters, nullahs/drains, open plots).

---

## 2. Waste Classes
For our baseline model, we define **5 distinct, practical classes**:

| Class ID | Class Name | Description | Examples |
|---|---|---|---|
| `0` | `plastic` | Single-use plastic, bottles, bags, wrappers | Water bottles, shopping bags, chip packets |
| `1` | `organic` | Food waste, fruit peels, decaying organic matter | Kitchen scraps, rotten vegetables |
| `2` | `dump_heap` | Large unsegregated pile of garbage on roadside/open plot | Overflowing street piles, kachra kundi spills |
| `3` | `metal_can` | Cans, tins, scrap metallic litter | Soda cans, food tins, wires |
| `4` | `paper_cardboard`| Cartons, paper waste, packaging boxes | Flattened cartons, newspapers, cups |

> **Beginner Tip:** If you want a simpler first version, you can even start with **2 classes**:
> `0: garbage_heap` (large piles needing municipality trucks)
> `1: litter` (scattered bottles, bags, cans)

---

## 3. YOLO Dataset Directory Structure
YOLO models expect data organized like this:

```text
ai/datasets/karachi_waste/
├── data.yaml                <-- Tells YOLO where images are and what the classes are
├── images/
│   ├── train/               <-- 70% to 80% of photos
│   ├── val/                 <-- 15% to 20% of photos for validation
│   └── test/                <-- 5% to 10% of photos for final check
└── labels/
    ├── train/               <-- Corresponding .txt label files for train photos
    ├── val/                 <-- Corresponding .txt label files for val photos
    └── test/                <-- Corresponding .txt label files for test photos
```

---

## 4. How YOLO Labels Work
For an image named `dump_001.jpg`, there must be a text file named `dump_001.txt`.
Each line in `dump_001.txt` represents **one bounding box**:

```text
<class_index> <x_center> <y_center> <width> <height>
```
All numbers are normalized between `0.0` and `1.0`:
- `x_center`: Horizontal center of the box divided by image width.
- `y_center`: Vertical center of the box divided by image height.
- `width`: Box width divided by image width.
- `height`: Box height divided by image height.

*Example:*
```text
2 0.523 0.612 0.340 0.420
0 0.210 0.780 0.080 0.095
```

---

## 5. Quick Ways to Get or Create Your Dataset

### Option A (Recommended for Quickstart): Download a Pre-labeled Roboflow Dataset
Roboflow Universe has thousands of community datasets tagged `waste-detection`, `garbage-detection`, and `trash-dataset`:
1. Go to [Roboflow Universe](https://universe.roboflow.com/) and search `waste detection`.
2. Pick a good dataset (e.g. `TACO` or `Waste Detection`).
3. Click **Export Dataset** $\rightarrow$ choose format **YOLOv8 / YOLO11**.
4. Download the zip and extract it into `ai/datasets/karachi_waste/`.

### Option B: Create Your Custom Karachi Dataset (using Roboflow / LabelImg)
1. Collect 50–200 photos of street waste (from Karachi streets, phone camera, or search).
2. Upload photos to [Roboflow.com](https://roboflow.com) (free tier).
3. Draw bounding boxes around garbage and tag the classes.
4. Export in **YOLOv11** format.
5. Extract the downloaded zip right into `ai/datasets/karachi_waste/`.

---

## 6. The `data.yaml` File
Once the dataset is in place, the `data.yaml` file looks like this:

```yaml
path: ../ai/datasets/karachi_waste # dataset root dir
train: images/train
val: images/val
test: images/test

names:
  0: plastic
  1: organic
  2: dump_heap
  3: metal_can
  4: paper_cardboard
```
