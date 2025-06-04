import React from 'react';

/**
 * direction: 'left' | 'right'
 * onClick: 클릭 이벤트
 * disabled: 비활성화 여부
 * className: 추가 클래스
 * style: 추가 스타일
 */
const ArrowButton = ({
  direction = 'right',
  onClick,
  disabled = false,
  className = '',
  style = {},
}) => {
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };
  return (
    <button
      type="button"
      aria-label={direction === 'left' ? '이전 슬라이드' : '다음 슬라이드'}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`movie-slider-arrow absolute top-1/2 -translate-y-1/2 z-10 ${direction === 'left' ? 'left-10' : 'right-10'} ${className}`}
      style={style}
    >
      <span className="select-none" aria-hidden="true">
        {direction === 'left' ? <>&#60;</> : <>&#62;</>}
      </span>
    </button>
  );
};

export default ArrowButton; 