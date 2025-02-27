# Bill Split App

A sophisticated bill splitting application built with React that makes expense sharing hassle-free. The app allows users to easily manage group expenses, process receipts, and calculate optimal settlements.

## 🚀 Features

- **Smart Receipt Processing**: Upload receipts to automatically extract bill details and items
- **Flexible Split Options**: Multiple splitting methods supported:
  - Equal splits
  - Percentage-based splits
  - Amount-based splits
  - Share-based splits
- **Dynamic Participant Management**: Add and manage participants globally or per bill
- **Intelligent Settlement Calculation**: Optimized algorithm to minimize the number of transactions needed for settlement
- **Bill Management**:
  - Save and load bills in JSON format
  - Add detailed bill information (name, date, location, notes)
  - Real-time calculation of individual shares
- **Responsive UI**: Built with Material-UI for a clean, modern interface

## 🛠️ Technical Stack

- **Frontend**: React.js with Hooks
- **UI Framework**: Material-UI (MUI)
- **State Management**: React useState and useEffect hooks
- **HTTP Client**: Axios for API communication
- **Build Tool**: Webpack
- **Testing**:
  - Unit tests with Jest
  - Integration tests
  - Visual regression tests
  - Accessibility tests
  - Browser compatibility tests
  - Performance tests

## 🏗️ Architecture

The application follows a modular architecture with:

- **Components**: Reusable UI components (BillDetails, ItemsSection, ParticipantsSection, SettlementSection)
- **Services**: API communication layer
- **Utils**: Helper functions for:
  - Bill calculations
  - Image processing
  - Settlement optimization
  - Bill persistence
  - Currency handling

## 💡 Implementation Highlights

- **Optimized Settlement Algorithm**: Implements a sophisticated algorithm to minimize the number of transactions needed for settling the bill
- **Real-time Calculations**: Automatic recalculation of shares when items or participants change
- **Error Handling**: Comprehensive error boundary implementation and input validation
- **Type Safety**: Structured data models and validation
- **Testing Coverage**: Extensive test suite covering unit, integration, and visual aspects

## 🔧 Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a .env file with REACT_APP_API_URL

4. Start the development server:
   ```bash
   npm start
   ```

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test
```

Different test categories:
- Unit tests: `npm run test:unit`
- Integration tests: `npm run test:integration`
- Visual regression tests: `npm run test:visual`
- Performance tests: `npm run test:performance`

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details
