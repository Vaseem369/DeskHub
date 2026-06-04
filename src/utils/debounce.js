export function debounce(callback, delay = 300) {
  let timeoutId;

  function debounced(...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(
      () => callback.apply(this, args),
      delay
    );
  }

  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debounced;
}

export default debounce;
