import React from 'react';
import GithubButton from './GithubButton';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', alignItems: 'center' }}>
        <GithubButton />
      </div>
    </footer>
  );
};

export default Footer;
