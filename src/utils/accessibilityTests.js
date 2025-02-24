import { axe } from '@jest-axe';

export const runAccessibilityTests = async (renderComponent) => {
  const { container } = renderComponent();
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

export const accessibilitySelectors = {
  // Selectors for common elements that should be accessible
  button: '[role="button"]',
  dialog: '[role="dialog"]',
  alert: '[role="alert"]',
  list: '[role="list"]',
  listitem: '[role="listitem"]',
  table: '[role="grid"]',
  cell: '[role="gridcell"]',
  tab: '[role="tab"]',
  tabpanel: '[role="tabpanel"]'
};

export const checkKeyboardNavigation = (elements) => {
  elements.forEach((element, index) => {
    element.focus();
    expect(document.activeElement).toBe(element);
  });
};

export const commonA11yTests = (renderComponent) => {
  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      await runAccessibilityTests(renderComponent);
    });

    test('all interactive elements are keyboard accessible', () => {
      const { container } = renderComponent();
      const interactiveElements = container.querySelectorAll('button, input, select, a, [role="button"]');
      checkKeyboardNavigation(Array.from(interactiveElements));
    });

    test('all images have alt text', () => {
      const { container } = renderComponent();
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });

    test('form controls have associated labels', () => {
      const { container } = renderComponent();
      const formControls = container.querySelectorAll('input, select, textarea');
      formControls.forEach(control => {
        const id = control.getAttribute('id');
        if (id) {
          const label = container.querySelector(`label[for="${id}"]`);
          expect(label).toBeInTheDocument();
        }
      });
    });
  });
};