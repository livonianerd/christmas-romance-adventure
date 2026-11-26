const defaults = { sound:true, reduced:false };

export function preferences(storage, reduced = false) {
  try {
    const saved = JSON.parse(storage.getItem('mistletoe-preferences'));
    return { sound: typeof saved?.sound === 'boolean' ? saved.sound : defaults.sound, reduced: typeof saved?.reduced === 'boolean' ? saved.reduced : reduced };
  } catch {
    return { ...defaults, reduced };
  }
}

export function savePreferences(storage, values) {
  try { storage.setItem('mistletoe-preferences', JSON.stringify(values)); } catch { /* Storage can be disabled. */ }
}

export class StorySession {
  constructor(chapters) {
    this.chapters = chapters;
    this.restart();
  }

  restart(now = Date.now()) {
    this.index = 0;
    this.started = now;
    this.elapsed = 0;
    this.achievements = new Set();
    this.ending = null;
    this.finished = false;
    this.resetChapter();
  }

  resetChapter() {
    this.collected = new Set();
    this.resolved = false;
  }

  get chapter() { return this.chapters[this.index]; }
  get ready() { return this.collected.size === this.chapter.items.length; }

  collect(index) {
    if (this.resolved || !this.chapter.items[index] || this.collected.has(index)) return false;
    this.collected.add(index);
    return true;
  }

  resolve() {
    if (!this.ready || this.resolved) return [];
    this.resolved = true;
    return this.chapter.unlock.filter(trope => {
      if (this.achievements.has(trope)) return false;
      this.achievements.add(trope);
      return true;
    });
  }

  next(now = Date.now()) {
    if (!this.resolved || this.finished) return false;
    if (this.index === this.chapters.length - 1) {
      if (this.ending === null) return false;
      this.finished = true;
      this.elapsed = Math.max(0, now - this.started);
    } else {
      this.index++;
      this.resetChapter();
    }
    return true;
  }

  choose(choice) {
    if (Number.isInteger(choice.ending)) this.ending = choice.ending;
    return choice.reply;
  }
}
