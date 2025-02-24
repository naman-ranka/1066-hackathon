import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Components that simulate different error scenarios
const ThrowError = ({ type = 'generic', delay = 0 }) => {
  React.useEffect(() => {
    if (delay) {
      const timer = setTimeout(() => {
        throw new Error(`${type} error`);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      throw new Error(`${type} error`);
    }
  }, [type, delay]);
  return null;
};

const ThrowAsync = ({ onError }) => {
  React.useEffect(() => {
    const fetchData = async () => {
      throw new Error('async error');
    };
    fetchData().catch(onError);
  }, [onError]);
  return <div>Loading...</div>;
};

describe('ErrorBoundary', () => {
  // Prevent console.error from cluttering test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Handling', () => {
    test('recovers from nested component errors', () => {
      const NestedError = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);
        if (shouldThrow) {
          throw new Error('nested error');
        }
        return <div>Recovered</div>;
      };

      render(
        <ErrorBoundary>
          <NestedError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText(/try again/i));
      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });

    test('handles multiple errors in different components', () => {
      const MultiError = () => {
        throw new Error('multiple errors');
      };

      const { container } = render(
        <>
          <ErrorBoundary>
            <MultiError />
          </ErrorBoundary>
          <ErrorBoundary>
            <MultiError />
          </ErrorBoundary>
        </>
      );

      const errorMessages = container.querySelectorAll('[role="alert"]');
      expect(errorMessages).toHaveLength(2);
    });

    test('preserves state during recovery', () => {
      const StatefulComponent = ({ onError }) => {
        const [count, setCount] = React.useState(0);
        
        if (count === 2) {
          throw new Error('state error');
        }

        return (
          <button onClick={() => setCount(c => c + 1)}>
            Count: {count}
          </button>
        );
      };

      render(
        <ErrorBoundary>
          <StatefulComponent />
        </ErrorBoundary>
      );

      const button = screen.getByText(/count: 0/i);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText(/try again/i));
      
      expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
    });
  });

  describe('Async Error Handling', () => {
    test('handles promise rejections', async () => {
      const onError = jest.fn();
      render(
        <ErrorBoundary>
          <ThrowAsync onError={onError} />
        </ErrorBoundary>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(onError).toHaveBeenCalled();
    });

    test('handles delayed errors', async () => {
      render(
        <ErrorBoundary>
          <ThrowError type="delayed" delay={100} />
        </ErrorBoundary>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Recovery Strategies', () => {
    test('attempts graceful degradation', () => {
      const GracefulComponent = () => {
        const [hasError, setHasError] = React.useState(false);
        
        if (hasError) {
          return <div>Fallback UI</div>;
        }

        try {
          throw new Error('graceful error');
        } catch {
          setHasError(true);
        }

        return null;
      };

      render(
        <ErrorBoundary>
          <GracefulComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Fallback UI')).toBeInTheDocument();
    });

    test('provides detailed error information in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError type="detailed" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/detailed error/i)).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    test('sanitizes error messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError type="sensitive-data" />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/sensitive-data/i)).not.toBeInTheDocument();
      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Reporting', () => {
    test('logs errors to console in development', () => {
      const spy = jest.spyOn(console, 'error');
      
      render(
        <ErrorBoundary>
          <ThrowError type="console" />
        </ErrorBoundary>
      );

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toMatch(/console error/i);
    });

    test('provides error metadata for logging', () => {
      const errorCallback = jest.fn();
      
      render(
        <ErrorBoundary onError={errorCallback}>
          <ThrowError type="metadata" />
        </ErrorBoundary>
      );

      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          errorInfo: expect.any(Object)
        })
      );
    });
  });

  describe('Accessibility', () => {
    test('announces errors to screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowError type="accessibility" />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    test('maintains focus management during recovery', () => {
      render(
        <ErrorBoundary>
          <ThrowError type="focus" />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByText(/try again/i);
      expect(tryAgainButton).toHaveFocus();
    });
  });
});