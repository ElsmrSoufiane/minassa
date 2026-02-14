import React, { useState } from 'react';
import './Rating.css';

const Rating = ({ phone, currentRating = 0, onRate, readOnly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const handleRate = (rating) => {
    if (!readOnly && onRate) {
      onRate(phone, rating);
    }
  };
  
  return (
    <div className="rating-container">
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${readOnly ? 'read-only' : ''}`}
            onClick={() => handleRate(star)}
            onMouseEnter={() => !readOnly && setHoverRating(star)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            disabled={readOnly}
            aria-label={`تقييم ${star} من 5`}
          >
            <span className={`star ${
              star <= (hoverRating || currentRating) ? 'filled' : ''
            }`}>
              ★
            </span>
          </button>
        ))}
      </div>
      
      {currentRating > 0 && (
        <div className="rating-info">
          <span className="rating-number">{currentRating.toFixed(1)}</span>
          <span className="rating-text">/ 5</span>
        </div>
      )}
    </div>
  );
};

export default Rating;