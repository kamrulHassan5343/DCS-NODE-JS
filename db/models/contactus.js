const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/database");


const ContactUs = sequelize.define('contactUs', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'title is required'
      },
      notEmpty: {
        msg: 'title cannot be empty'
      },
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'subject is required'
      },
      notEmpty: {
        msg: 'subject cannot be empty'
      },
    }
  },
  details: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'details is required'
      },
      notEmpty: {
        msg: 'details cannot be empty'
      },
    }
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE
  }
}, {
  freezeTableName: true,
  modelName: 'contactUs'
});

module.exports = ContactUs;