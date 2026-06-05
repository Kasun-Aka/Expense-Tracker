from sqlalchemy import Column, Integer, String, Date, Numeric
from datetime import date
from app.db.database import Base

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    currency = Column(String(10), nullable=False, index=True)
    rate_to_lkr = Column(Numeric(15, 6), nullable=False)
