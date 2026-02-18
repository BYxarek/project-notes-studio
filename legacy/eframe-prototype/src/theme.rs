use eframe::egui;
use eframe::egui::Color32;

pub fn draw_animated_background(ctx: &egui::Context) {
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

pub fn apply_style(ctx: &egui::Context) {
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

pub fn mix_color(a: Color32, b: Color32, t: f32) -> Color32 {
    let t = t.clamp(0.0, 1.0);
    let r = a.r() as f32 + (b.r() as f32 - a.r() as f32) * t;
    let g = a.g() as f32 + (b.g() as f32 - a.g() as f32) * t;
    let b2 = a.b() as f32 + (b.b() as f32 - a.b() as f32) * t;
    let a2 = a.a() as f32 + (b.a() as f32 - a.a() as f32) * t;
    Color32::from_rgba_premultiplied(r as u8, g as u8, b2 as u8, a2 as u8)
}
