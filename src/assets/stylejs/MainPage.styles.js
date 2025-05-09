import styled from 'styled-components';

export const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  button {
    outline: none;
    color: #DAA06D;
    padding: 1em;
    padding-left: 3em;
    padding-right: 3em;
    border: 2px dashed #DAA06D;
    border-radius: 15px;
    background-color: #EADDCA;
    box-shadow: 0 0 0 4px #EADDCA, 2px 2px 4px 2px rgba(0, 0, 0, 0.5);
    transition: .1s ease-in-out, .4s color;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    margin-bottom: 2rem;
  }

  button:active {
    transform: translateX(0.1em) translateY(0.1em);
    box-shadow: 0 0 0 4px #EADDCA, 1.5px 1.5px 2.5px 1.5px rgba(0, 0, 0, 0.5);
  }

  @media (max-width: 600px) {
    button {
      font-size: 1rem;
      padding: 0.7em 1.5em;
    }
  }
`;