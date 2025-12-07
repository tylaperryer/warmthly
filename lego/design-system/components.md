# Component Library

Complete reference for all Warmthly components.

## Base Component

All components extend `BaseComponent` which provides:
- Consistent lifecycle hooks
- Error handling with error boundary
- Type-safe attribute management
- Shadow DOM support
- Event dispatching

## Form Components

### WarmthlyForm

Base form component with validation and submission.

**Attributes:**
- `action` - Form action URL
- `method` - HTTP method (default: "post")
- `novalidate` - Disable browser validation
- `disabled` - Disable form

**Events:**
- `form:submit` - Fired on form submission
- `form:success` - Fired on successful submission
- `form:error` - Fired on validation or submission error

**Usage:**
```html
<warmthly-form action="/api/submit" method="post">
  <warmthly-input name="email" type="email" required></warmthly-input>
  <warmthly-button type="submit">Submit</warmthly-button>
</warmthly-form>
```

### WarmthlyInput

Accessible input field with validation.

**Attributes:**
- `name` - Field name
- `type` - Input type (text, email, url, etc.)
- `value` - Initial value
- `placeholder` - Placeholder text
- `label` - Label text
- `required` - Required field
- `disabled` - Disabled state
- `readonly` - Read-only state
- `minlength` - Minimum length
- `maxlength` - Maximum length
- `pattern` - Validation pattern
- `autocomplete` - Autocomplete hint

**Events:**
- `input:validate` - Fired on validation

**Methods:**
- `getValue()` - Get current value
- `setValue(value)` - Set value
- `isValid()` - Check if valid

**Usage:**
```html
<warmthly-input 
  name="email" 
  type="email" 
  label="Email Address"
  required
  placeholder="your@email.com">
</warmthly-input>
```

### WarmthlyTextarea

Accessible textarea with validation.

**Attributes:**
- `name` - Field name
- `value` - Initial value
- `placeholder` - Placeholder text
- `label` - Label text
- `required` - Required field
- `disabled` - Disabled state
- `readonly` - Read-only state
- `minlength` - Minimum length
- `maxlength` - Maximum length
- `rows` - Number of rows (default: 4)
- `cols` - Number of columns (default: 40)

**Methods:**
- `getValue()` - Get current value
- `setValue(value)` - Set value
- `isValid()` - Check if valid

**Usage:**
```html
<warmthly-textarea 
  name="message" 
  label="Message"
  required
  placeholder="Enter your message...">
</warmthly-textarea>
```

### WarmthlySelect

Accessible select dropdown.

**Attributes:**
- `name` - Field name
- `value` - Selected value
- `label` - Label text
- `required` - Required field
- `disabled` - Disabled state
- `multiple` - Multiple selection
- `size` - Visible options

**Methods:**
- `getValue()` - Get selected value
- `setValue(value)` - Set selected value
- `isValid()` - Check if valid

**Usage:**
```html
<warmthly-select name="country" label="Country" required>
  <option value="">Select a country</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</warmthly-select>
```

### WarmthlyButton

Button with loading states.

**Attributes:**
- `type` - Button type (button, submit, reset)
- `variant` - Button variant (primary, secondary, danger, ghost)
- `disabled` - Disabled state
- `loading` - Loading state
- `aria-label` - Accessible label

**Methods:**
- `setLoadingState(loading)` - Set loading state
- `click()` - Trigger click

**Usage:**
```html
<warmthly-button type="submit" variant="primary" loading>Submit</warmthly-button>
```

### WarmthlyFieldGroup

Groups form fields with label, help text, and error message.

**Attributes:**
- `label` - Field label
- `help` - Help text
- `error` - Error message
- `required` - Required indicator
- `id` - Field ID

**Methods:**
- `setError(message)` - Set error message
- `clearError()` - Clear error

**Usage:**
```html
<warmthly-field-group label="Email" help="We'll never share your email" required>
  <warmthly-input name="email" type="email"></warmthly-input>
</warmthly-field-group>
```

## Loading Components

### WarmthlySkeleton

Loading placeholder for better perceived performance.

**Attributes:**
- `width` - Width (default: "100%")
- `height` - Height (default: "20px")
- `variant` - Variant (text, rect, circle, custom)
- `lines` - Number of lines (for text variant)
- `size` - Size (for circle variant)
- `animated` - Show animation (default: true)

**Usage:**
```html
<warmthly-skeleton width="200" height="20"></warmthly-skeleton>
<warmthly-skeleton variant="text" lines="3"></warmthly-skeleton>
<warmthly-skeleton variant="circle" size="40"></warmthly-skeleton>
```

### WarmthlySpinner

Loading spinner component.

**Attributes:**
- `size` - Size (small, medium, large)
- `label` - Loading label
- `aria-label` - Accessible label

**Usage:**
```html
<warmthly-spinner size="medium" label="Loading..."></warmthly-spinner>
```

### WarmthlyProgress

Progress bar component.

**Attributes:**
- `value` - Current value
- `max` - Maximum value (default: 100)
- `indeterminate` - Indeterminate progress
- `label` - Progress label
- `aria-label` - Accessible label

**Methods:**
- `setValue(value)` - Set progress value
- `getValue()` - Get current value
- `getMax()` - Get max value

**Usage:**
```html
<warmthly-progress value="50" max="100"></warmthly-progress>
<warmthly-progress indeterminate label="Processing..."></warmthly-progress>
```

## Accessibility Components

### WarmthlyModal

Accessible modal dialog.

**Attributes:**
- `open` - Open state
- `title` - Modal title
- `aria-label` - Accessible label

**Methods:**
- `open()` - Open modal
- `close()` - Close modal

**Events:**
- `modal:open` - Fired when modal opens
- `modal:close` - Fired when modal closes

**Slots:**
- `footer` - Footer content (buttons, etc.)

**Usage:**
```html
<warmthly-modal id="myModal" title="Confirm Action">
  <p>Are you sure you want to proceed?</p>
  <warmthly-button slot="footer" onclick="closeModal()">Cancel</warmthly-button>
  <warmthly-button slot="footer" variant="primary" onclick="confirmAction()">Confirm</warmthly-button>
</warmthly-modal>
```

### WarmthlyTooltip

Accessible tooltip component.

**Attributes:**
- `position` - Position (top, bottom, left, right)
- `delay` - Show delay in ms (default: 200)
- `aria-label` - Accessible label

**Usage:**
```html
<button>
  Hover me
  <warmthly-tooltip>This is a helpful tooltip</warmthly-tooltip>
</button>
```

## Privacy & Security

All components are privacy-first:
- ✅ No tracking
- ✅ No cookies
- ✅ No analytics
- ✅ No third-party scripts
- ✅ Client-side only

## Accessibility

All components follow WCAG 2.1 AA standards:
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA attributes
- ✅ Focus management
- ✅ Color contrast

