import React from 'react';
import renderer from 'react-test-renderer';
import BillDetails from './BillDetails';
import ItemsSection from './ItemsSection';
import ParticipantsSection from './ParticipantsSection';
import SettlementSection from './SettlementSection';

describe('Visual Regression Tests', () => {
  const mockBillInfo = {
    billName: 'Test Dinner',
    totalAmount: 100,
    billDate: new Date('2024-01-30'),
    location: 'Test Restaurant',
    notes: 'Test notes',
    payers: [
      { participantId: 1, name: 'Alice', amount: 100 }
    ]
  };

  const mockItems = [
    {
      id: 1,
      name: 'Pizza',
      quantity: 2,
      price: 20,
      taxRate: 10,
      splitType: 'equal',
      splits: {},
      includedParticipants: []
    }
  ];

  const mockParticipants = [
    { id: 1, name: 'Alice', amountPaid: 100, amountOwed: 50 },
    { id: 2, name: 'Bob', amountPaid: 0, amountOwed: 50 }
  ];

  const mockSettlement = [
    { from: 'Bob', to: 'Alice', amount: '50.00' }
  ];

  test('BillDetails renders consistently', () => {
    const tree = renderer
      .create(
        <BillDetails 
          billInfo={mockBillInfo}
          setBillInfo={() => {}}
          onUploadReceipt={() => {}}
          billParticipants={mockParticipants}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('ItemsSection renders consistently', () => {
    const tree = renderer
      .create(
        <ItemsSection
          items={mockItems}
          setItems={() => {}}
          billParticipants={mockParticipants}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('ParticipantsSection renders consistently', () => {
    const tree = renderer
      .create(
        <ParticipantsSection
          allParticipants={mockParticipants}
          billParticipants={mockParticipants}
          setBillParticipants={() => {}}
          billInfo={mockBillInfo}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('SettlementSection renders consistently', () => {
    const tree = renderer
      .create(
        <SettlementSection
          items={mockItems}
          billInfo={mockBillInfo}
          billParticipants={mockParticipants}
          settlement={mockSettlement}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  describe('Different screen sizes', () => {
    beforeEach(() => {
      // Mock window resize
      global.innerWidth = 1024;
      global.innerHeight = 768;
    });

    test('components are responsive on mobile', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;
      
      const tree = renderer
        .create(
          <div>
            <BillDetails 
              billInfo={mockBillInfo}
              setBillInfo={() => {}}
              onUploadReceipt={() => {}}
              billParticipants={mockParticipants}
            />
            <ItemsSection
              items={mockItems}
              setItems={() => {}}
              billParticipants={mockParticipants}
            />
          </div>
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });

    test('components are responsive on tablet', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
      
      const tree = renderer
        .create(
          <div>
            <ParticipantsSection
              allParticipants={mockParticipants}
              billParticipants={mockParticipants}
              setBillParticipants={() => {}}
              billInfo={mockBillInfo}
            />
            <SettlementSection
              items={mockItems}
              billInfo={mockBillInfo}
              billParticipants={mockParticipants}
              settlement={mockSettlement}
            />
          </div>
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('Different states', () => {
    test('components handle loading state', () => {
      const tree = renderer
        .create(
          <div>
            <BillDetails 
              billInfo={{ ...mockBillInfo, isLoading: true }}
              setBillInfo={() => {}}
              onUploadReceipt={() => {}}
              billParticipants={[]}
            />
            <ItemsSection
              items={[]}
              setItems={() => {}}
              billParticipants={[]}
              isLoading={true}
            />
          </div>
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });

    test('components handle error state', () => {
      const tree = renderer
        .create(
          <div>
            <BillDetails 
              billInfo={{ ...mockBillInfo, error: 'Failed to load' }}
              setBillInfo={() => {}}
              onUploadReceipt={() => {}}
              billParticipants={[]}
            />
            <ItemsSection
              items={[]}
              setItems={() => {}}
              billParticipants={[]}
              error="Failed to load items"
            />
          </div>
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});