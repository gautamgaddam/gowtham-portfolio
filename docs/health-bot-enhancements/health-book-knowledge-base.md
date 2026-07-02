# Health Book Knowledge Base

The Health Books library is a curated RAG knowledge base for naturopathy, bodybuilding, and yoga books. Books are educational context for the chatbot; they do not replace clinical evidence, diagnosis, emergency care, or prescribed treatment.

## Add One Book From The Dashboard

1. Open `/dashboard/health` and go to the Books library panel.
2. Use an admin account.
3. Upload a legally usable PDF or EPUB.
4. Enter the title, author, category, tags, and visibility.
5. Choose one category:
   - `naturopathy`
   - `bodybuilding`
   - `yoga`
6. Add optional tags such as `nutrition`, `strength-training`, `mobility`, `breathwork`, `herbal-remedies`, `recovery`, or `fasting`.
7. Wait for status `ready`.
8. Ask the chatbot a category-specific question and confirm that it cites the book source.

Shared books are available to signed-in health chatbot users. `admin_only` books are available only to the configured health admin.

## Bulk Import From `books/`

Place PDF or EPUB files in the repo `books/` folder, then run:

```bash
npm run import:health-books
```

Use this for bulk local imports. The importer infers category from file names and content hints:

- Yoga: `yoga`, `asana`, `pranayama`, `meditation`, `mobility`
- Bodybuilding: `bodybuilding`, `muscle`, `hypertrophy`, `strength`, `protein`, `training`
- Naturopathy: `naturopathy`, `natural`, `herbal`, `remedy`, `fasting`, `detox`

Run with `-- --force` to reprocess books that are already ready:

```bash
npm run import:health-books -- --force
```

## Verification Prompts

Use these after adding books:

- `What does my yoga library say about back pain?`
- `Use the bodybuilding books to explain hypertrophy for beginners.`
- `What naturopathy options are mentioned for inflammation?`

Expected behavior:

- The answer cites book/document sources when used.
- Naturopathy and remedy claims are separated from scientific or clinical guidance.
- Bodybuilding and yoga guidance is conservative around injury, pregnancy, dizziness, uncontrolled blood pressure, heart disease, severe pain, and eating disorder risk.
- Supplements, fasting, detox, intense training, breath retention, and inversions include appropriate safety cautions.
