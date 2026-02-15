#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use eframe::egui;
use eframe::egui::{Color32, Id, RichText};
use serde::{Deserialize, Serialize};
use std::fs;

const DATA_FILE: &str = "notes_data.json";

#[derive(Clone, Serialize, Deserialize)]
struct StepItem {
    text: String,
    done: bool,
}

#[derive(Clone, Serialize, Deserialize)]
struct Note {
    id: u64,
    title: String,
    body: String,
    steps: Vec<StepItem>,
}

#[derive(Clone, Serialize, Deserialize)]
struct Project {
    id: u64,
    name: String,
    description: String,
    notes: Vec<Note>,
}

#[derive(Clone, Serialize, Deserialize)]
struct AppData {
    next_id: u64,
    projects: Vec<Project>,
}

impl Default for AppData {
    fn default() -> Self {
        Self {
            next_id: 1,
            projects: Vec::new(),
        }
    }
}

impl AppData {
    fn alloc_id(&mut self) -> u64 {
        let id = self.next_id.max(1);
        self.next_id = id + 1;
        id
    }
}

struct NotesApp {
    data: AppData,
    selected_project_id: Option<u64>,
    selected_note_id: Option<u64>,

    new_project_name: String,
    new_project_description: String,
    new_note_title: String,
    new_note_body: String,
    new_step_text: String,

    status: String,
}

impl NotesApp {
    fn new(cc: &eframe::CreationContext<'_>) -> Self {
        apply_style(&cc.egui_ctx);

        let data = load_data(DATA_FILE);
        let selected_project_id = data.projects.first().map(|p| p.id);

        Self {
            data,
            selected_project_id,
            selected_note_id: None,
            new_project_name: String::new(),
            new_project_description: String::new(),
            new_note_title: String::new(),
            new_note_body: String::new(),
            new_step_text: String::new(),
            status: "Ready".to_string(),
        }
    }

    fn selected_project(&self) -> Option<&Project> {
        let id = self.selected_project_id?;
        self.data.projects.iter().find(|p| p.id == id)
    }

    fn save(&mut self) {
        self.status = match save_data(DATA_FILE, &self.data) {
            Ok(()) => "Saved".to_string(),
            Err(err) => format!("Save failed: {err}"),
        };
    }

    fn add_project(&mut self) {
        let name = self.new_project_name.trim();
        if name.is_empty() {
            self.status = "Project name cannot be empty".to_string();
            return;
        }

        let id = self.data.alloc_id();
        self.data.projects.push(Project {
            id,
            name: name.to_string(),
            description: self.new_project_description.trim().to_string(),
            notes: Vec::new(),
        });

        self.new_project_name.clear();
        self.new_project_description.clear();
        self.selected_project_id = Some(id);
        self.selected_note_id = None;
        self.save();
    }

    fn delete_selected_project(&mut self) {
        let Some(project_id) = self.selected_project_id else {
            return;
        };

        self.data.projects.retain(|p| p.id != project_id);
        self.selected_project_id = self.data.projects.first().map(|p| p.id);
        self.selected_note_id = None;
        self.save();
    }

    fn add_note(&mut self) {
        let title = self.new_note_title.trim();
        if title.is_empty() {
            self.status = "Note title cannot be empty".to_string();
            return;
        }

        let note_id = self.data.alloc_id();
        let note = Note {
            id: note_id,
            title: title.to_string(),
            body: self.new_note_body.trim().to_string(),
            steps: Vec::new(),
        };

        let Some(project_id) = self.selected_project_id else {
            return;
        };

        if let Some(project_idx) = self.data.projects.iter().position(|p| p.id == project_id) {
            self.data.projects[project_idx].notes.push(note);
            self.selected_note_id = Some(note_id);
            self.new_note_title.clear();
            self.new_note_body.clear();
            self.save();
        }
    }

    fn delete_note(&mut self, note_id: u64) {
        let Some(project_id) = self.selected_project_id else {
            return;
        };

        let mut first_note = None;
        let mut removed = false;

        if let Some(project_idx) = self.data.projects.iter().position(|p| p.id == project_id) {
            let before = self.data.projects[project_idx].notes.len();
            self.data.projects[project_idx]
                .notes
                .retain(|n| n.id != note_id);
            let after = self.data.projects[project_idx].notes.len();
            removed = after < before;
            first_note = self.data.projects[project_idx].notes.first().map(|n| n.id);
        }

        if removed {
            if self.selected_note_id == Some(note_id) {
                self.selected_note_id = first_note;
            }
            self.save();
        }
    }
}

impl eframe::App for NotesApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        draw_animated_background(ctx);

        egui::TopBottomPanel::top("top_bar")
            .resizable(false)
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    ui.heading(RichText::new("Project Notes Studio").size(26.0));
                    ui.label(
                        RichText::new("projects, notes, action steps")
                            .color(Color32::from_rgb(168, 190, 206)),
                    );
                });

                if let Some(project) = self.selected_project() {
                    let (done, total) = project
                        .notes
                        .iter()
                        .flat_map(|n| n.steps.iter())
                        .fold((0_u32, 0_u32), |(d, t), s| (d + u32::from(s.done), t + 1));
                    let progress = if total == 0 {
                        0.0
                    } else {
                        done as f32 / total as f32
                    };
                    ui.add(
                        egui::ProgressBar::new(progress)
                            .desired_width(ui.available_width())
                            .text(format!("Progress: {done}/{total} steps done")),
                    );
                }
            });

        egui::SidePanel::left("projects_panel")
            .resizable(true)
            .default_width(290.0)
            .show(ctx, |ui| {
                ui.heading("Projects");
                ui.separator();

                egui::ScrollArea::vertical()
                    .max_height(240.0)
                    .show(ui, |ui| {
                        for project in &self.data.projects {
                            let selected = self.selected_project_id == Some(project.id);
                            let t =
                                ctx.animate_bool(Id::new(("project_sel", project.id)), selected);
                            let tint = mix_color(
                                Color32::from_rgb(33, 45, 58),
                                Color32::from_rgb(83, 126, 153),
                                t,
                            );

                            egui::Frame::default().fill(tint).show(ui, |ui| {
                                let label = format!("{} ({})", project.name, project.notes.len());
                                if ui
                                    .selectable_label(selected, RichText::new(label).size(15.0))
                                    .clicked()
                                {
                                    self.selected_project_id = Some(project.id);
                                    self.selected_note_id = None;
                                }
                            });
                            ui.add_space(4.0);
                        }
                    });

                ui.separator();
                ui.label(RichText::new("Create project").strong());
                ui.add(
                    egui::TextEdit::singleline(&mut self.new_project_name)
                        .hint_text("Project name"),
                );
                ui.add(
                    egui::TextEdit::multiline(&mut self.new_project_description)
                        .desired_rows(2)
                        .hint_text("Description"),
                );

                ui.horizontal(|ui| {
                    if ui.button("Add project").clicked() {
                        self.add_project();
                    }
                    if ui.button("Delete selected").clicked() {
                        self.delete_selected_project();
                    }
                });
            });

        egui::CentralPanel::default().show(ctx, |ui| {
            let Some(project_id) = self.selected_project_id else {
                ui.vertical_centered(|ui| {
                    ui.add_space(80.0);
                    ui.heading("Create your first project");
                    ui.label("Use the panel on the left to add a project.");
                });
                return;
            };

            let mut changed = false;
            let mut note_to_delete = None;
            ui.heading(RichText::new("Project editor").size(22.0));
            ui.separator();

            ui.label("Project name");
            if let Some(project_idx) = self.data.projects.iter().position(|p| p.id == project_id) {
                if ui
                    .text_edit_singleline(&mut self.data.projects[project_idx].name)
                    .changed()
                {
                    changed = true;
                }
            }

            ui.label("Project description");
            if let Some(project_idx) = self.data.projects.iter().position(|p| p.id == project_id) {
                if ui
                    .add(
                        egui::TextEdit::multiline(&mut self.data.projects[project_idx].description)
                            .desired_rows(3),
                    )
                    .changed()
                {
                    changed = true;
                }
            }

            ui.separator();
            ui.label(RichText::new("New note").strong());

            let mut request_add_note = false;
            if ui
                .add(egui::TextEdit::singleline(&mut self.new_note_title).hint_text("Note title"))
                .lost_focus()
                && ui.input(|i| i.key_pressed(egui::Key::Enter))
            {
                request_add_note = true;
            }

            ui.add(
                egui::TextEdit::multiline(&mut self.new_note_body)
                    .desired_rows(2)
                    .hint_text("Quick note text"),
            );

            if ui.button("Add note").clicked() {
                request_add_note = true;
            }

            if request_add_note {
                self.add_note();
            }

            ui.separator();
            ui.heading("Notes");

            let mut selected_note_id = self.selected_note_id;
            let mut step_input = std::mem::take(&mut self.new_step_text);

            if let Some(project_idx) = self.data.projects.iter().position(|p| p.id == project_id) {
                let project = &mut self.data.projects[project_idx];
                egui::ScrollArea::vertical().show(ui, |ui| {
                    for note in &mut project.notes {
                        let selected = selected_note_id == Some(note.id);
                        let anim = ctx.animate_bool(Id::new(("note_sel", note.id)), selected);
                        let frame_color = mix_color(
                            Color32::from_rgb(28, 36, 46),
                            Color32::from_rgb(56, 90, 113),
                            anim,
                        );

                        egui::Frame::default().fill(frame_color).show(ui, |ui| {
                            ui.horizontal(|ui| {
                                if ui
                                    .selectable_label(selected, RichText::new("Select").strong())
                                    .clicked()
                                {
                                    selected_note_id = Some(note.id);
                                }
                                if ui.button("Delete").clicked() {
                                    note_to_delete = Some(note.id);
                                }
                            });

                            ui.label("Title");
                            if ui.text_edit_singleline(&mut note.title).changed() {
                                changed = true;
                            }

                            ui.label("Text");
                            if ui
                                .add(egui::TextEdit::multiline(&mut note.body).desired_rows(4))
                                .changed()
                            {
                                changed = true;
                            }

                            ui.label(RichText::new("Action sequence").strong());

                            let mut step_to_delete = None;
                            let mut move_up = None;
                            let mut move_down = None;

                            for idx in 0..note.steps.len() {
                                ui.horizontal(|ui| {
                                    if ui.checkbox(&mut note.steps[idx].done, "").changed() {
                                        changed = true;
                                    }

                                    if ui
                                        .add(
                                            egui::TextEdit::singleline(&mut note.steps[idx].text)
                                                .desired_width(320.0),
                                        )
                                        .changed()
                                    {
                                        changed = true;
                                    }

                                    if ui.small_button("↑").clicked() && idx > 0 {
                                        move_up = Some(idx);
                                    }
                                    if ui.small_button("↓").clicked() && idx + 1 < note.steps.len()
                                    {
                                        move_down = Some(idx);
                                    }
                                    if ui.small_button("x").clicked() {
                                        step_to_delete = Some(idx);
                                    }
                                });
                            }

                            if let Some(i) = move_up {
                                note.steps.swap(i, i - 1);
                                changed = true;
                            }
                            if let Some(i) = move_down {
                                note.steps.swap(i, i + 1);
                                changed = true;
                            }
                            if let Some(i) = step_to_delete {
                                note.steps.remove(i);
                                changed = true;
                            }

                            ui.horizontal(|ui| {
                                ui.add(
                                    egui::TextEdit::singleline(&mut step_input)
                                        .desired_width(320.0)
                                        .hint_text("New action step"),
                                );

                                if ui.button("Add step").clicked() {
                                    let text = step_input.trim();
                                    if !text.is_empty() {
                                        note.steps.push(StepItem {
                                            text: text.to_string(),
                                            done: false,
                                        });
                                        step_input.clear();
                                        changed = true;
                                    }
                                }
                            });
                        });

                        ui.add_space(8.0);
                    }
                });
            }

            self.selected_note_id = selected_note_id;
            self.new_step_text = step_input;

            if let Some(note_id) = note_to_delete {
                self.delete_note(note_id);
            }

            if changed {
                self.save();
            }
        });

        egui::TopBottomPanel::bottom("bottom_status")
            .resizable(false)
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    ui.label(RichText::new("Status:").strong());
                    ui.label(&self.status);
                });
            });
    }
}

fn draw_animated_background(ctx: &egui::Context) {
    let layer = egui::LayerId::background();
    let painter = ctx.layer_painter(layer);
    let rect = ctx.screen_rect();

    let stripes = 36;
    for i in 0..stripes {
        let t0 = i as f32 / stripes as f32;
        let t1 = (i + 1) as f32 / stripes as f32;
        let y0 = egui::lerp(rect.top()..=rect.bottom(), t0);
        let y1 = egui::lerp(rect.top()..=rect.bottom(), t1);
        let color = mix_color(
            Color32::from_rgb(14, 20, 27),
            Color32::from_rgb(22, 35, 47),
            t0,
        );
        painter.rect_filled(
            egui::Rect::from_min_max(egui::pos2(rect.left(), y0), egui::pos2(rect.right(), y1)),
            0.0,
            color,
        );
    }

    let time = ctx.input(|i| i.time as f32);
    let x = rect.left() + rect.width() * (0.5 + 0.35 * (time * 0.4).sin());
    let y = rect.top() + rect.height() * (0.25 + 0.08 * (time * 0.8).cos());

    painter.circle_filled(
        egui::pos2(x, y),
        160.0,
        Color32::from_rgba_premultiplied(255, 144, 92, 28),
    );
    painter.circle_filled(
        egui::pos2(rect.right() - x * 0.2, rect.bottom() - y * 0.15),
        220.0,
        Color32::from_rgba_premultiplied(74, 170, 206, 22),
    );

    ctx.request_repaint();
}

fn mix_color(a: Color32, b: Color32, t: f32) -> Color32 {
    let t = t.clamp(0.0, 1.0);
    let r = a.r() as f32 + (b.r() as f32 - a.r() as f32) * t;
    let g = a.g() as f32 + (b.g() as f32 - a.g() as f32) * t;
    let b2 = a.b() as f32 + (b.b() as f32 - a.b() as f32) * t;
    let a2 = a.a() as f32 + (b.a() as f32 - a.a() as f32) * t;
    Color32::from_rgba_premultiplied(r as u8, g as u8, b2 as u8, a2 as u8)
}

fn apply_style(ctx: &egui::Context) {
    let mut style = (*ctx.style()).clone();
    style.spacing.item_spacing = egui::vec2(10.0, 10.0);
    style.spacing.button_padding = egui::vec2(12.0, 8.0);

    let mut visuals = egui::Visuals::dark();
    visuals.window_fill = Color32::from_rgb(17, 24, 32);
    visuals.panel_fill = Color32::from_rgba_premultiplied(18, 26, 34, 220);
    visuals.widgets.inactive.bg_fill = Color32::from_rgb(36, 49, 62);
    visuals.widgets.hovered.bg_fill = Color32::from_rgb(64, 88, 106);
    visuals.widgets.active.bg_fill = Color32::from_rgb(85, 121, 144);
    visuals.override_text_color = Some(Color32::from_rgb(236, 243, 248));
    style.visuals = visuals;

    ctx.set_style(style);
}

fn load_data(path: &str) -> AppData {
    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return AppData::default(),
    };

    serde_json::from_str(&content).unwrap_or_default()
}

fn save_data(path: &str, data: &AppData) -> std::io::Result<()> {
    let json = serde_json::to_string_pretty(data)
        .map_err(|err| std::io::Error::other(format!("json error: {err}")))?;
    fs::write(path, json)
}

fn main() -> Result<(), eframe::Error> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([1180.0, 760.0])
            .with_min_inner_size([920.0, 620.0]),
        ..Default::default()
    };

    eframe::run_native(
        "Project Notes Studio",
        options,
        Box::new(|cc| Ok(Box::new(NotesApp::new(cc)))),
    )
}
