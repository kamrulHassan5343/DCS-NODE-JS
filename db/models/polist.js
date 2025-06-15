const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Polist = sequelize.define('polist', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER
  },
  cono: {
    type: DataTypes.STRING(8),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'cono is required'
      },
      notEmpty: {
        msg: 'cono cannot be empty'
      },
    }
  },
  coname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  sessionno: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  opendate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  openingbal: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  emethod: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cashinhand: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  enteredby: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  deviceid: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'status is required'
      }
    }
  },
  branchcode: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  branchname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  projectcode: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  desig: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  lastposynctime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sl_no: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  clearstatus: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  abm: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mobileno: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sls: {
    type: DataTypes.SMALLINT,
    allowNull: true
  },
  checklogin: {
    type: DataTypes.SMALLINT,
    allowNull: true
  },
  imei: {
    type: DataTypes.STRING(17),
    allowNull: true
  },
  qsoftid: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  trxsl: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  admindeviceid: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  upgdeviceid: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  token: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  token_create_time: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  backup_status: {
    type: DataTypes.SMALLINT,
    allowNull: true
  },
  leave_status: {
    type: DataTypes.SMALLINT,
    allowNull: true
  },
  leave_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fp_token: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  fp_token_create_time: {
    type: DataTypes.STRING(30),
    allowNull: true
  },

}, {
  freezeTableName: true,
  modelName: 'polist',
  timestamps: false
});

module.exports = Polist;