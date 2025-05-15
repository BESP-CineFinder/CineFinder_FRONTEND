import React from 'react';
import styled from 'styled-components';

const DropDown = ({ options = [], value, onChange, id }) => {
  return (
    <StyledWrapper>
      <div className="select">
        <div className="selected" tabIndex={0}>
          {options.find(opt => opt.value === value)?.label || options[0]?.label}
          <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" className="arrow">
            <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
          </svg>
        </div>
        <div className="options">
          {options.map(opt => (
            <div key={opt.value} title={opt.label}>
              <input
                id={`${id}-${opt.value}`}
                name={id}
                type="radio"
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
              />
              <label className="option" htmlFor={`${id}-${opt.value}`} data-txt={opt.label} />
            </div>
          ))}
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .select {
    width: 100%;
    cursor: pointer;
    position: relative;
    transition: 300ms;
    color: white;
    overflow: visible;
  }

  .selected {
    background-color: #2a2f3b;
    padding: 5px;
    margin-top: 3px;
    height: 30px;
    margin-bottom: 3px;
    border-radius: 5px;
    position: relative;
    z-index: 100000;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .arrow {
    position: relative;
    right: 0px;
    height: 10px;
    transform: rotate(-90deg);
    width: 25px;
    fill: white;
    z-index: 100000;
    transition: 300ms;
  }

  .options {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    padding: 5px;
    margin-top: 1px;
    background-color: #2a2f3b;
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    opacity: 0;
    pointer-events: none;
    transition: 300ms;
    z-index: 10001;
    max-height: 280px;
    overflow-y: auto;
  }

  .select:hover > .options {
    opacity: 1;
    top: 100%;
    pointer-events: auto;
  }

  .select:hover > .selected .arrow {
    transform: rotate(0deg);
  }

  .option {
    border-radius: 5px;
    padding: 5px;
    transition: 300ms;
    background-color: #2a2f3b;
    width: 90%;
    font-size: 15px;
  }
  .option:hover {
    background-color: #323741;
  }

  .options input[type="radio"] {
    display: none;
  }

  .options label {
    display: inline-block;
    color: white;
  }
  .options label::before {
    content: attr(data-txt);
  }

  .options input[type="radio"]:checked + label {
    display: none;
  }

  .select:has(.options input[type="radio"]:checked) .selected::before {
    content: attr(data-txt);
  }
`;

export default DropDown;
