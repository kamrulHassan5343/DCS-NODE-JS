'use strict';
const {
  Model,
  Sequelize
} = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../../config/database');
const AppError = require('../../utils/appError');
const project = require('./project');
const user = sequelize.define('users',{
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },
  userType: {
    type: Sequelize.ENUM('0','1','2'),
    allowNull: false,
    validate:{
      notNull: {
        msg: 'User type is required'
      },
      notEmpty: {
        msg: 'User type cannot be empty'
      },
    }
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate:{
      notNull: {
        msg: 'First Name is required'
      },
      notEmpty: {
        msg: 'First Name cannot be empty'
      },
    }
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate:{
      notNull: {
        msg: 'Last Name is required'
      },
      notEmpty: {
        msg: 'Last Name cannot be empty'
      },
    }
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
    validate:{
      notNull: {
        msg: 'Email is required'
      },
      notEmpty: {
        msg: 'Email cannot be empty'
      },
    }
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate:{
      notNull: {
        msg: 'Password is required'
      },
      notEmpty: {
        msg: 'Password cannot be empty'
      },
    }
  },
  confirmPassword: {
    type: Sequelize.VIRTUAL,
    set(value){
      if (this.password.length < 7) {
        throw new AppError(
            'Password length must be grater than 7',
            400
        );
    }
      if (value === this.password) {
        const hashPassword = bcrypt.hashSync(value,10);
        this.setDataValue('password',hashPassword);
      }else{
        throw new AppError("Password and Confirm password must be the same",400);
      }
    }
  },
  createdAt: {
    allowNull: false,
    type: Sequelize.DATE
  },
  updatedAt: {
    allowNull: false,
    type: Sequelize.DATE
  },
  deletedAt: {
    type: Sequelize.DATE
  }
},
{
  paranoid: true,
  freezeTableName: true,
  modelName: 'users',
}
);
user.hasMany(project, { foreignKey: 'createdBy' });
project.belongsTo(user, { foreignKey: 'createdBy' });

module.exports = user;