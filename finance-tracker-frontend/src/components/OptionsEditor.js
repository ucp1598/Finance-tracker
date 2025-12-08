import React, { useState, useEffect } from 'react';
import './OptionsEditor.css';

const OptionsEditor = ({ show, title, options, onSave, onClose }) => {
  const [currentOptions, setCurrentOptions] = useState([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (options) {
      setCurrentOptions([...options]);
    }
  }, [options]);

  if (!show) {
    return null;
  }

  const handleAddItem = () => {
    if (newItem && !currentOptions.includes(newItem)) {
      setCurrentOptions([...currentOptions, newItem]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (itemToRemove) => {
    setCurrentOptions(currentOptions.filter(item => item !== itemToRemove));
  };

  const handleSave = () => {
    onSave(currentOptions);
    onClose();
  };

  return (
    <div className="options-editor-overlay">
      <div className="options-editor-modal">
        <div className="options-editor-header">
          <h3>Edit {title}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="options-editor-body">
          <div className="add-item-form">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add new item..."
            />
            <button onClick={handleAddItem}>Add</button>
          </div>
          <ul className="options-list">
            {currentOptions.map((item, index) => (
              <li key={index}>
                <span>{item}</span>
                <button onClick={() => handleRemoveItem(item)} className="remove-item-button">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="options-editor-footer">
          <button onClick={onClose} className="footer-button cancel">Cancel</button>
          <button onClick={handleSave} className="footer-button save">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default OptionsEditor;