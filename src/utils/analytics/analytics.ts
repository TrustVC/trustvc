type GaActionDefault = 'page_view';

interface GaEventProps {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

interface GaPageViewProps {
  action: GaActionDefault;
}

export const validateGtag = (): boolean => {
  const isInit = typeof gtag === 'function';
  if (!isInit) console.warn('gtag is not initialised');
  return isInit;
};

export const validatePageViewEvent = (gaEvent: GaPageViewProps): void => {
  const { action } = gaEvent;
  if (!action) console.error('Action is required');
  if (action && typeof action !== 'string') console.error('Action must be a string');
};

export const gaPageView = (gaEvent: GaPageViewProps, gaId: string): void => {
  if (!validateGtag()) return;
  validatePageViewEvent(gaEvent);
  const { action } = gaEvent;

  gtag('event', action, {
    send_to: gaId,
  });
};

export const validateGaEvent = (gaEvent: GaEventProps): void => {
  const { action, category, label, value } = gaEvent;
  if (!category) console.error('Category is required');
  if (!action) console.error('Action is required');
  if (label && typeof label !== 'string') console.error('Label must be a string');
  if (value && typeof value !== 'number') console.error('Value must be a number');
};

export const gaEvent = (gaEvent: GaEventProps): void => {
  if (!validateGtag()) return;
  validateGaEvent(gaEvent);
  const { action, category, label, value } = gaEvent;

  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
