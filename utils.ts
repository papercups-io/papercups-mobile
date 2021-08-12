export const noop = () => {};

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const getColorByUuid = (uuid?: string | null) => {
  if (!uuid) {
    return 'blue';
  }

  const colorIndex = parseInt(uuid, 32) % 5;
  const color = ['red', 'yellow', 'green', 'purple', 'indigo'][colorIndex];

  return color;
};

export const formatServerError = (err: any) => {
  try {
    const error = err?.response?.body?.error ?? {};
    const {errors = {}, message, status} = error;

    if (status === 422 && Object.keys(errors).length > 0) {
      const messages = Object.keys(errors)
        .map((field) => {
          const description = errors[field];

          if (description) {
            return `${field} ${description}`;
          } else {
            return `invalid ${field}`;
          }
        })
        .join(', ');

      return `Error: ${messages}.`;
    } else {
      return (
        message ||
        err?.message ||
        'Something went wrong. Please contact us or try again in a few minutes.'
      );
    }
  } catch {
    return (
      err?.response?.body?.error?.message ||
      err?.message ||
      'Something went wrong. Please contact us or try again in a few minutes.'
    );
  }
};
