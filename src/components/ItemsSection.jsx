// src/components/ItemsSection.jsx
import React from 'react';
import '../App.css';

function ItemsSection({
  items,
  setItems,
  handleAddItem,
  handleRemoveItem,
  billParticipants // array of currently selected participants from BillDetails
}) {
  // Helper to display "All" if everything is selected, "None" if empty, etc.
  // If you want to compare to a known list of possible names (like 3 or 6),
  // just do so here. For example, if we know there are 3 possible names:
  const totalPossible = 3; 
  // Or if you have 6 fixed names:
  // const totalPossible = 6;

  const getParticipantDisplay = (arr) => {
    if (!arr || arr.length === 0) {
      return 'None';
    } else if (arr.length === totalPossible) {
      return 'All';
    } else {
      return arr.join(', ');
    }
  };

  return (
    <section className="sectionContainer">
      <h2>2. Items</h2>
      <button onClick={handleAddItem} className="addButton">
        ADD NEW ITEM
      </button>

      <table className="itemsTable">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Tax</th>
            <th>Participants</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  type="text"
                  placeholder="Item Name"
                  value={item.name}
                  onChange={(e) =>
                    setItems(items.map((i) =>
                      i.id === item.id ? { ...i, name: e.target.value } : i
                    ))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.qty}
                  onChange={(e) =>
                    setItems(items.map((i) =>
                      i.id === item.id ? { ...i, qty: e.target.value } : i
                    ))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) =>
                    setItems(items.map((i) =>
                      i.id === item.id ? { ...i, price: e.target.value } : i
                    ))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  placeholder="Tax %"
                  value={item.tax}
                  onChange={(e) =>
                    setItems(items.map((i) =>
                      i.id === item.id ? { ...i, tax: e.target.value } : i
                    ))
                  }
                />
              </td>
              {/* Participants - read only */}
              <td>
                {getParticipantDisplay(billParticipants)}
              </td>
              <td>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="removeButton"
                >
                  REMOVE
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default ItemsSection;
