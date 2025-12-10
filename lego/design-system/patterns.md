# Design Patterns

Common patterns and best practices for using Warmthly components.

## Form Patterns

### Basic Form

```html
<warmthly-form action="/api/submit" method="post">
  <warmthly-field-group label="Email" required>
    <warmthly-input name="email" type="email" placeholder="your@email.com"></warmthly-input>
  </warmthly-field-group>

  <warmthly-field-group label="Message" help="Please provide details">
    <warmthly-textarea name="message" rows="5" required></warmthly-textarea>
  </warmthly-field-group>

  <warmthly-button type="submit" variant="primary">Submit</warmthly-button>
</warmthly-form>
```

### Form with Validation

```html
<warmthly-form action="/api/submit" method="post">
  <warmthly-field-group label="Email" required>
    <warmthly-input
      name="email"
      type="email"
      minlength="5"
      maxlength="254"
      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
    >
    </warmthly-input>
  </warmthly-field-group>

  <warmthly-button type="submit" variant="primary">Submit</warmthly-button>
</warmthly-form>

<script>
  const form = document.querySelector('warmthly-form');
  form.addEventListener('form:error', e => {
    console.error('Form errors:', e.detail.errors);
  });
  form.addEventListener('form:success', e => {
    console.log('Form submitted:', e.detail.data);
  });
</script>
```

### Form with Loading State

```html
<warmthly-form action="/api/submit" method="post">
  <warmthly-input name="email" type="email" required></warmthly-input>
  <warmthly-button type="submit" variant="primary" id="submitBtn">Submit</warmthly-button>
</warmthly-form>

<script>
  const form = document.querySelector('warmthly-form');
  const button = document.getElementById('submitBtn');

  form.addEventListener('form:submit', () => {
    button.setAttribute('loading', '');
  });

  form.addEventListener('form:success', () => {
    button.removeAttribute('loading');
  });

  form.addEventListener('form:error', () => {
    button.removeAttribute('loading');
  });
</script>
```

## Loading Patterns

### Skeleton Loading

```html
<!-- Show skeleton while loading -->
<div id="content">
  <warmthly-skeleton variant="text" lines="3"></warmthly-skeleton>
</div>

<script>
  async function loadContent() {
    const content = await fetch('/api/content').then(r => r.json());
    document.getElementById('content').innerHTML = `
      <h1>${content.title}</h1>
      <p>${content.body}</p>
    `;
  }
  loadContent();
</script>
```

### Spinner Loading

```html
<warmthly-button id="loadBtn" onclick="loadData()">Load Data</warmthly-button>
<div id="result"></div>

<script>
  async function loadData() {
    const btn = document.getElementById('loadBtn');
    const result = document.getElementById('result');

    btn.setAttribute('loading', '');
    result.innerHTML = '<warmthly-spinner label="Loading data..."></warmthly-spinner>';

    try {
      const data = await fetch('/api/data').then(r => r.json());
      result.innerHTML = `<p>${data.message}</p>`;
    } finally {
      btn.removeAttribute('loading');
    }
  }
</script>
```

### Progress Indicator

```html
<warmthly-progress id="progress" value="0" max="100"></warmthly-progress>

<script>
  async function uploadFile(file) {
    const progress = document.getElementById('progress');
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progress.setValue(percent);
      }
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  }
</script>
```

## Modal Patterns

### Confirmation Modal

```html
<warmthly-modal id="confirmModal" title="Confirm Action">
  <p>Are you sure you want to delete this item?</p>
  <warmthly-button slot="footer" onclick="closeModal()">Cancel</warmthly-button>
  <warmthly-button slot="footer" variant="danger" onclick="confirmDelete()">Delete</warmthly-button>
</warmthly-modal>

<script>
  function closeModal() {
    document.getElementById('confirmModal').close();
  }

  function confirmDelete() {
    // Delete logic
    closeModal();
  }

  function showDeleteConfirmation() {
    document.getElementById('confirmModal').open();
  }
</script>
```

### Form Modal

```html
<warmthly-modal id="formModal" title="Add Item">
  <warmthly-form action="/api/add" method="post">
    <warmthly-input name="name" label="Name" required></warmthly-input>
    <warmthly-button slot="footer" onclick="closeModal()">Cancel</warmthly-button>
    <warmthly-button slot="footer" type="submit" variant="primary">Add</warmthly-button>
  </warmthly-form>
</warmthly-modal>
```

## Tooltip Patterns

### Helpful Tooltips

```html
<button>
  Submit Form
  <warmthly-tooltip>Click to submit your form</warmthly-tooltip>
</button>

<input type="text" placeholder="Enter email" />
<warmthly-tooltip position="right" delay="500">
  We'll never share your email address
</warmthly-tooltip>
```

## Error Handling Patterns

### Form Error Display

```html
<warmthly-form action="/api/submit" method="post">
  <warmthly-field-group label="Email" id="emailGroup">
    <warmthly-input name="email" type="email" required></warmthly-input>
  </warmthly-field-group>

  <warmthly-button type="submit">Submit</warmthly-button>
</warmthly-form>

<script>
  const form = document.querySelector('warmthly-form');
  form.addEventListener('form:error', e => {
    if (e.detail.errors?.email) {
      document.getElementById('emailGroup').setError(e.detail.errors.email);
    }
  });
</script>
```

## Component Composition

### Reusable Form Field

```html
<warmthly-field-group label="Email" help="Required for account creation" required>
  <warmthly-input
    name="email"
    type="email"
    placeholder="your@email.com"
    minlength="5"
    maxlength="254"
  >
  </warmthly-input>
</warmthly-field-group>
```

### Loading States

```html
<div id="card">
  <warmthly-skeleton variant="rect" width="100%" height="200"></warmthly-skeleton>
</div>

<script>
  async function loadCard() {
    const card = document.getElementById('card');
    const data = await fetch('/api/card').then(r => r.json());
    card.innerHTML = `
      <h2>${data.title}</h2>
      <p>${data.content}</p>
    `;
  }
  loadCard();
</script>
```

## Best Practices

1. **Always use labels** - Every form field should have a label
2. **Provide help text** - Use help text for complex fields
3. **Show loading states** - Use skeletons or spinners during async operations
4. **Handle errors gracefully** - Display errors clearly and helpfully
5. **Use semantic HTML** - Components enhance, don't replace semantic HTML
6. **Test keyboard navigation** - Ensure all interactions work with keyboard
7. **Test screen readers** - Verify components work with assistive technology
8. **Respect user preferences** - Dark mode and reduced motion are supported
