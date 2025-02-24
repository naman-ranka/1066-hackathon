import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './headers';

describe('Header', () => {
  test('renders application title', () => {
    render(<Header />);
    expect(screen.getByText(/bill split/i)).toBeInTheDocument();
  });

  test('renders upload buttons', () => {
    render(<Header />);
    expect(screen.getByText(/upload json/i)).toBeInTheDocument();
    expect(screen.getByText(/upload receipt/i)).toBeInTheDocument();
  });

  test('handles JSON file upload', () => {
    const onUploadJson = jest.fn();
    render(<Header onUploadJson={onUploadJson} />);

    const file = new File(
      ['{"billInfo": {"billName": "Test"}}'],
      'test.json',
      { type: 'application/json' }
    );

    const input = screen.getByLabelText(/upload json/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(onUploadJson).toHaveBeenCalledWith(file);
  });

  test('handles receipt image upload', () => {
    const onUploadReceipt = jest.fn();
    render(<Header onUploadReceipt={onUploadReceipt} />);

    const file = new File(['dummy image'], 'receipt.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload receipt/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(onUploadReceipt).toHaveBeenCalledWith(file);
  });

  test('displays error for invalid JSON file type', () => {
    render(<Header />);
    const file = new File(['not json'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload json/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
  });

  test('displays error for invalid image file type', () => {
    render(<Header />);
    const file = new File(['not an image'], 'doc.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload receipt/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
  });

  test('handles empty file selection', () => {
    const onUploadJson = jest.fn();
    const onUploadReceipt = jest.fn();
    render(<Header onUploadJson={onUploadJson} onUploadReceipt={onUploadReceipt} />);

    const jsonInput = screen.getByLabelText(/upload json/i);
    const receiptInput = screen.getByLabelText(/upload receipt/i);

    fireEvent.change(jsonInput, { target: { files: [] } });
    fireEvent.change(receiptInput, { target: { files: [] } });

    expect(onUploadJson).not.toHaveBeenCalled();
    expect(onUploadReceipt).not.toHaveBeenCalled();
  });
});