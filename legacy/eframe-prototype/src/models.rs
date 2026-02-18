use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct StepItem {
    pub text: String,
    pub done: bool,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: u64,
    pub title: String,
    pub body: String,
    pub steps: Vec<StepItem>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub notes: Vec<Note>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct AppData {
    pub next_id: u64,
    pub projects: Vec<Project>,
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
    pub fn alloc_id(&mut self) -> u64 {
        let id = self.next_id.max(1);
        self.next_id = id + 1;
        id
    }
}
