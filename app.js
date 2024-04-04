const express = require("express");
const mysql = require("mysql");
const pdfMaster = require("pdf-master");
const fs = require('fs');


const app = express();

//DB connection details
let connection = mysql.createConnection({
    host: "localhost",
    database: "franchiseeinvoicedb",
    user: "root",
    password: "SPUinv1302@46",
    port: 3306
    //password: "Saanvi355@"

  });

const PORT = process.env.PORT || 3000;

// data object passing to html(.hbs) template
let data = {};

//Get data of students from DB
async function getInvoiceData(startDate, endDate, sSegment) {
    let sqlquery = `SELECT invoice_generation_table.InvoiceNumber as InvoiceNumber,
    invoice_generation_table.InvoiceDate  as InvoiceDate,
    invoice_generation_table.SPUNumber as SPUNumber,
    invoice_generation_table.CRMTicketNumber as CRMTicketNumber,
    invoice_generation_table.DocumentNumber as DocumentNumber,
    invoice_generation_table.DocumentDate as DocumentDate,
    invoice_generation_table.VendorName as VendorName,
    invoice_generation_table.VendorCode as VendorCode,
    invoice_generation_table.CustomerCode as CustomerCode,
    invoice_generation_table.ShipToPartyNumber as ShipToPartyNumber,
    invoice_generation_table.ShipToPartyName as ShipToPartyName,
    invoice_generation_table.SubTotal as SubTotal,
    invoice_generation_table.SGST as SGST,
    invoice_generation_table.CGST as CGST,
    invoice_generation_table.IGST as IGST,
    invoice_generation_table.RoundOff as RoundOff,
    invoice_generation_table.GrandTotal as GrandTotal,
    invoice_generation_table.regionCode as regionCode,
    invoice_generation_table.segmentCode as segmentCode,
    invoice_generation_table.UGST as UGST,
    customer_master_table.branchname as CustomerName,
    customer_master_table.gstinnum as customergstinnum,
    customer_master_table.address as customeraddress,
    customer_master_table.pincode as customerpincode,
    customer_master_table.regioncode as customerregioncode,
    customer_master_table.regiondesc as customerregiondesc,
    customer_master_table.pannum as customerpannum,
    customer_master_table.customer_cin as customercin,
    vendor_master_table.address as vendoraddress,
    vendor_master_table.gstinnum as vendorgstinnum,
    vendor_master_table.pannum as vendorpannum,
    vendor_master_table.pincode as vendorpincode,
    vendor_master_table.state as vendorstate,
    vendor_master_table.statedesc as vendorstatedesc,
    vendor_master_table.regioncode as vendorregioncode,
    vendor_master_table.regioncode as vendorregiondesc,
    vendor_master_table.city as vendorcity,
    vendor_master_table.vendor_cin as vendorcin
    
    FROM invoice_generation_table
    LEFT OUTER JOIN customer_master_table ON invoice_generation_table.CustomerCode = customer_master_table.branchcode
    LEFT OUTER JOIN vendor_master_table ON invoice_generation_table.VendorCode = vendor_master_table.vendorcode
    where invoice_generation_table.InvoiceDate >= ${startDate} and 
    invoice_generation_table.InvoiceDate <= ${endDate} and invoice_generation_table.segmentCode = ${sSegment};`;

    return new Promise((resolve, reject) => {
      connection.query(sqlquery, (err, result) => {
        if (err) {
          reject(err);
        }
        //console.log(result);
        resolve(result);
      });
    });
  }

  async function getInvoiceMasterData(startDate, endDate, sSegment) {
  let sqlquery = `SELECT * FROM invoice_master_table where Document_Date >= ${startDate} and Document_Date <= ${endDate} and Segment = ${sSegment};`;
  //let sqlquery = `SELECT * FROM invoice_master_table where Document_Date = ${startDate};`;

    return new Promise((resolve, reject) => {
      connection.query(sqlquery, (err, result) => {
        if (err) {
          reject(err);
        }
        //console.log(result);
        resolve(result);
      });
    });
  }

  function convertNumberToWords(amount) {
    var words = new Array();
    words[0] = '';
    words[1] = 'One';
    words[2] = 'Two';
    words[3] = 'Three';
    words[4] = 'Four';
    words[5] = 'Five';
    words[6] = 'Six';
    words[7] = 'Seven';
    words[8] = 'Eight';
    words[9] = 'Nine';
    words[10] = 'Ten';
    words[11] = 'Eleven';
    words[12] = 'Twelve';
    words[13] = 'Thirteen';
    words[14] = 'Fourteen';
    words[15] = 'Fifteen';
    words[16] = 'Sixteen';
    words[17] = 'Seventeen';
    words[18] = 'Eighteen';
    words[19] = 'Nineteen';
    words[20] = 'Twenty';
    words[30] = 'Thirty';
    words[40] = 'Forty';
    words[50] = 'Fifty';
    words[60] = 'Sixty';
    words[70] = 'Seventy';
    words[80] = 'Eighty';
    words[90] = 'Ninety';
    amount = amount.toString();
    var atemp = amount.split(".");
    var number = atemp[0].split(",").join("");
    var n_length = number.length;
    var words_string = "";
    if (n_length <= 9) {
        var n_array = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
        var received_n_array = new Array();
        for (var i = 0; i < n_length; i++) {
            received_n_array[i] = number.substr(i, 1);
        }
        for (var i = 9 - n_length, j = 0; i < 9; i++, j++) {
            n_array[i] = received_n_array[j];
        }
        for (var i = 0, j = 1; i < 9; i++, j++) {
            if (i == 0 || i == 2 || i == 4 || i == 7) {
                if (n_array[i] == 1) {
                    n_array[j] = 10 + parseInt(n_array[j]);
                    n_array[i] = 0;
                }
            }
        }
        value = "";
        for (var i = 0; i < 9; i++) {
            if (i == 0 || i == 2 || i == 4 || i == 7) {
                value = n_array[i] * 10;
            } else {
                value = n_array[i];
            }
            if (value != 0) {
                words_string += words[value] + " ";
            }
            if ((i == 1 && value != 0) || (i == 0 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Crores ";
            }
            if ((i == 3 && value != 0) || (i == 2 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Lakhs ";
            }
            if ((i == 5 && value != 0) || (i == 4 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Thousand ";
            }
            if (i == 6 && value != 0 && (n_array[i + 1] != 0 && n_array[i + 2] != 0)) {
                words_string += "Hundred and ";
            } else if (i == 6 && value != 0) {
                words_string += "Hundred ";
            }
        }
        words_string = words_string.split("  ").join(" ");
    }
    return words_string;
}

  function withDecimal(n) {
    var nums = n.toString().split('.')
    var whole = convertNumberToWords(nums[0])
    if (nums.length == 2) {
        var fraction = convertNumberToWords(nums[1])
        if(parseInt(nums[1]) != parseInt("00")){
          return whole + ' Rupees and ' + fraction + ' Paisa';
        }else{
          return whole + ' Rupees';
        }
        
    } else {
        return whole + ' Rupees';
    }
}

  //call getStudentData
async function getData(startDate, endDate, sSegment) {

  const invoiceData = await getInvoiceData(startDate, endDate, sSegment);
  const invoiceMasterData = await getInvoiceMasterData(startDate, endDate, sSegment);
  var sItems = [];

  //console.log(invoiceData)
  //console.log(invoiceMasterData.length)

    return new Promise( (resolve, reject) => {

      try{

        for(var i=0; i<invoiceData.length; i++){
          var sItem = {};
          sItem.invoiceNumber = invoiceData[i].InvoiceNumber;
          sItem.invoiceDate   = `${invoiceData[i].InvoiceDate.substring(6, 8)}-${invoiceData[i].InvoiceDate.substring(4, 6)}-${invoiceData[i].InvoiceDate.substring(0, 4)}`;
          sItem.orderNumber   = invoiceData[i].CRMTicketNumber;
          sItem.DocumentNumber   = invoiceData[i].DocumentNumber;
          sItem.vendorName    = invoiceData[i].VendorName;
          sItem.vendorAddress = invoiceData[i].vendoraddress;
          sItem.vendorCity    = invoiceData[i].vendorcity;
          sItem.vendorState   = invoiceData[i].vendorstatedesc;
          sItem.vendorStateCode = invoiceData[i].vendorstate;
          sItem.vendorPIN = invoiceData[i].vendorpincode;
          sItem.vendorGSTIN = invoiceData[i].vendorgstinnum;
          sItem.vendorCIN = invoiceData[i].vendorcin;
          sItem.vendorPAN = invoiceData[i].vendorpannum;
          sItem.branchName = invoiceData[i].CustomerName;
          sItem.branchAddress = invoiceData[i].customeraddress;
          sItem.branchCity = invoiceData[i].customercity;
          sItem.branchPIN = invoiceData[i].customerpincode;
          sItem.branchState = invoiceData[i].customerregiondesc;
          sItem.branchStateCode = invoiceData[i].customerregioncode;
          sItem.branchGSTIN = invoiceData[i].customergstinnum;
          sItem.branchPAN = invoiceData[i].customerpannum;
          sItem.branchCIN = invoiceData[i].customercin;
          sItem.endCustomerName = invoiceData[i].ShipToPartyName;
          sItem.subTotal = (parseFloat(invoiceData[i].SubTotal)).toFixed(2);
            if(invoiceData[i].CGST == 0 || invoiceData[i].CGST == "0.00" || invoiceData[i].CGST == "0.0" || invoiceData[i].CGST == "" || invoiceData[i].CGST == " " || invoiceData[i].CGST == undefined){
              sItem.CGST =  "0.00";
            }else{
              sItem.CGST =  (parseFloat(invoiceData[i].CGST)).toFixed(2);
            }

            if(isNaN(parseFloat(sItem.CGST))){
              sItem.CGST = 0;
            }

          if(invoiceData[i].IGST == 0 || invoiceData[i].IGST == "0.00" || invoiceData[i].IGST == "0.0" || invoiceData[i].IGST == "" || invoiceData[i].IGST == " " || invoiceData[i].IGST == undefined){
            sItem.IGST =  "0.00";
          }else{
            sItem.IGST = (parseFloat(invoiceData[i].IGST)).toFixed(2);
          }

          if(isNaN(parseFloat(sItem.IGST))){
            sItem.IGST = 0;
          }
          
          if(invoiceData[i].SGST == 0 || invoiceData[i].SGST == "0.00" || invoiceData[i].SGST == "0.0" || invoiceData[i].SGST == "" || invoiceData[i].SGST == " " || invoiceData[i].SGST == undefined){
            if(invoiceData[i].UGST == 0 || invoiceData[i].UGST == "0.00" || invoiceData[i].UGST == "0.0" || invoiceData[i].UGST == "" || invoiceData[i].UGST == " " || invoiceData[i].UGST == undefined){
              sItem.SGST = "0.00";
            }else{
              sItem.SGST = (parseFloat(invoiceData[i].UGST)).toFixed(2);
            }
          }else{
            sItem.SGST = (parseFloat(invoiceData[i].SGST)).toFixed(2);
          }

          if(isNaN(parseFloat(sItem.SGST))){
            sItem.SGST = 0;
          }
          
          sItem.roundOff = (parseFloat(invoiceData[i].RoundOff)).toFixed(2);
          sItem.totalDiscount = "0.00";
          sItem.GrandTotal = (parseFloat(invoiceData[i].GrandTotal)).toFixed(2);
          sItem.totalInvoiceValueInFigures = (parseFloat(invoiceData[i].GrandTotal)).toFixed(2);
          sItem.totalInvoiceValueInWords = withDecimal((parseFloat(invoiceData[i].GrandTotal)).toFixed(2));
          sItem.taxAmountInWords = withDecimal((parseFloat(sItem.CGST) + parseFloat(sItem.SGST) + parseFloat(sItem.IGST)).toFixed(2))
          // sItem.bankName
          // sItem.accountNumber
          // sItem.branchIFSCCode
          var sMaterialHTML = [];
          var sTotalUnit = 0;
          var sHSNListHTML = [];
          var srNo = 1;
          for(var j=0; j<invoiceMasterData.length; j++){
          // endCustomerGSTIN

            if(invoiceData[i].DocumentNumber.trim() == invoiceMasterData[j].Document_Number.trim()){

              sItem.endCustomerAddress = `${invoiceMasterData[j].Address_1} ${invoiceMasterData[j].Address_2} ${invoiceMasterData[j].Address_3}`;
              sItem.endCustomerCity = invoiceMasterData[j].City;
              sItem.endCustomerPIN = invoiceMasterData[j].Pin;
              sItem.endCustomerState = invoiceMasterData[j].Ship_To_Party_Region_Desc;
              sItem.endCustomerStateCode = invoiceMasterData[j].Ship_To_Party_Region;
              sItem.endCustomerContactNumber = invoiceMasterData[j].Ship_To_Party_MobileNumber;
              sItem.placeOfSupply = invoiceMasterData[j].Ship_To_Party_Region_Desc;
              sItem.deliveryNotes = invoiceMasterData[j].Sales_Doc_Number;
              sItem.orderDate     = `${invoiceMasterData[j].Document_Posting_Date.substring(6, 8)}-${invoiceMasterData[j].Document_Posting_Date.substring(4, 6)}-${invoiceMasterData[j].Document_Posting_Date.substring(0, 4)}`;

              var a = {
                SRNo: srNo,
                materialCode: invoiceMasterData[j].Material_Code,
                materialDesc: invoiceMasterData[j].Material_Description,
                hsn: invoiceMasterData[j].HSN,
                Quantity: invoiceMasterData[j].Quantity,
                UOM: invoiceMasterData[j].UOM,
                rate: (parseFloat(invoiceMasterData[j].Spare_Value)).toFixed(2),
                Disc: "0.00",
                total: (parseFloat(invoiceMasterData[j].Spare_Value)).toFixed(2)
              }
              sMaterialHTML.push(a);
              srNo++;
              sTotalUnit = sTotalUnit + parseInt(invoiceMasterData[j].Quantity);
              var CGSTPercentage;
              var SGSTPercentage;
              var IGSTPercentage;

              if(invoiceMasterData[j].CGST_Percentage == 0 || invoiceMasterData[j].CGST_Percentage == "0.00" || invoiceMasterData[j].CGST_Percentage == "0.0" || invoiceMasterData[j].CGST_Percentage == "" || invoiceMasterData[j].CGST_Percentage == " " || invoiceMasterData[j].CGST_Percentage == undefined){
                CGSTPercentage = 0;
              }else{
                CGSTPercentage = parseFloat(invoiceMasterData[j].CGST_Percentage).toFixed(2);
              }

              if(isNaN(CGSTPercentage)){
                CGSTPercentage = 0;
              }

              if(invoiceMasterData[j].SGST_Percentage == 0 || invoiceMasterData[j].SGST_Percentage == "0.00" || invoiceMasterData[j].SGST_Percentage == "0.0" || invoiceMasterData[j].SGST_Percentage == "" || invoiceMasterData[j].SGST_Percentage == " " || invoiceMasterData[j].SGST_Percentage == undefined){
                if(invoiceMasterData[j].UGST_Percentage == 0 || invoiceMasterData[j].UGST_Percentage == "0.00" || invoiceMasterData[j].UGST_Percentage == "0.0" || invoiceMasterData[j].UGST_Percentage == "" || invoiceMasterData[j].UGST_Percentage == " " || invoiceMasterData[j].UGST_Percentage == undefined){
                  SGSTPercentage = 0;
                }else{
                  SGSTPercentage = parseFloat(invoiceMasterData[j].UGST_Percentage).toFixed(2);
                }
              }else{
                SGSTPercentage = parseFloat(invoiceMasterData[j].SGST_Percentage).toFixed(2);
              }

              if(isNaN(SGSTPercentage)){
                SGSTPercentage = 0;
              }

              if(invoiceMasterData[j].IGST_Percentage == 0 || invoiceMasterData[j].IGST_Percentage == "0.00" || invoiceMasterData[j].IGST_Percentage == "0.0" || invoiceMasterData[j].IGST_Percentage == "" || invoiceMasterData[j].IGST_Percentage == " " || invoiceMasterData[j].IGST_Percentage == undefined){
                IGSTPercentage = 0;
              }else{
                IGSTPercentage = parseFloat(invoiceMasterData[j].IGST_Percentage).toFixed(2);
              }

              if(isNaN(IGSTPercentage)){
                IGSTPercentage = 0;
              }

              var taxPercentAmountCGST = (parseFloat(invoiceMasterData[j].Spare_Value) * (CGSTPercentage / 100)).toFixed(2);
              var taxPercentAmountSGST = (parseFloat(invoiceMasterData[j].Spare_Value) * (SGSTPercentage / 100)).toFixed(2);
              var taxPercentAmountIGST = (parseFloat(invoiceMasterData[j].Spare_Value) * (IGSTPercentage / 100)).toFixed(2);
    
              var b = {
                HSN: invoiceMasterData[j].HSN,
                taxableValue: invoiceMasterData[j].Spare_Value,
                CGSTPercentage: CGSTPercentage,
                CGST: taxPercentAmountCGST,
                SGSTPercentage: SGSTPercentage,
                SGST: taxPercentAmountSGST,
                IGSTPercentage: IGSTPercentage,
                IGST: taxPercentAmountIGST
    
              }
    
              sHSNListHTML.push(b);
    
            }
          }
          //Group by HSN
          var result = [];
          sHSNListHTML.reduce(function (res, value) {
              if (!res[value.HSN]) {
                  res[value.HSN] = {
                      taxableValue: 0,
                      HSN: value.HSN,
                      CGSTPercentage: value.CGSTPercentage,
                      CGST: 0,
                      SGSTPercentage: value.SGSTPercentage,
                      SGST: 0,
                      IGSTPercentage: value.IGSTPercentage,
                      IGST: 0
                  };
                  result.push(res[value.HSN])
              }
              res[value.HSN].taxableValue = (parseFloat(res[value.HSN].taxableValue) + parseFloat(value.taxableValue)).toFixed(2);
              res[value.HSN].CGST = (parseFloat(res[value.HSN].CGST) + parseFloat(value.CGST)).toFixed(2);
              res[value.HSN].SGST = (parseFloat(res[value.HSN].SGST) + parseFloat(value.SGST)).toFixed(2);
              res[value.HSN].IGST = (parseFloat(res[value.HSN].IGST) + parseFloat(value.IGST)).toFixed(2);
              return res;
          }, {});
          sItem.materials = sMaterialHTML;
          sItem.hsnLists  = result;
          sItem.totalUnit = parseFloat(sTotalUnit).toFixed(3);
          sItems.push(sItem);
          //console.log(sItems);
        };
        resolve(sItems);

      } catch(e){
        reject(e);
      }
    });
  }

  async function finalpdfGenerationOriginals(sData, sStartDate, sEndDate, sSegment) {
      return new Promise((resolve, reject) => {

        const folderName = `C:\/Invoices\/${sStartDate.substring(4, 6)}${sStartDate.substring(0, 4)}${sSegment}\/Originals`;

        try {
          if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, { recursive: true });
          }
        } catch (err) {
          console.error(err);
          reject(err);
        }

        sData.invoiceType = "ORIGINAL FOR RECIPIENT";

        let options = {
          displayHeaderFooter: false,
          format: "A4",
          margin: { top: "30px", bottom: "30px", left: "30px", right: "30px" },
          path: `${folderName}/${sData.DocumentNumber}.PDF`
        };
        let sPDF = pdfMaster.generatePdf("template.hbs", sData, options);
        updateFolderLocation(sData.DocumentNumber, `${folderName}/${sData.DocumentNumber}.PDF`, "O");
        resolve(sPDF);
        
      });
    }

    async function finalpdfGenerationDuplicates(sData, sStartDate, sEndDate, sSegment) {
      return new Promise((resolve, reject) => {

        const folderName = `C:\/Invoices\/${sStartDate.substring(4, 6)}${sStartDate.substring(0, 4)}${sSegment}\/Duplicates`;

        try {
          if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, { recursive: true });
          }
        } catch (err) {
          console.error(err);
          reject(err);
        }

        sData.invoiceType = "DUPLICATE FOR TRANSPORTER";

        let options = {
          displayHeaderFooter: false,
          format: "A4",
          margin: { top: "30px", bottom: "30px", left: "30px", right: "30px" },
          path: `${folderName}/${sData.DocumentNumber}.PDF`
        };
        let sPDF = pdfMaster.generatePdf("template.hbs", sData, options);
        updateFolderLocation(sData.DocumentNumber, `${folderName}/${sData.DocumentNumber}.PDF`, "D");
        resolve(sPDF);
        
      });
    }

    async function finalpdfGenerationTriplicates(sData, sStartDate, sEndDate, sSegment) {
      return new Promise((resolve, reject) => {

        const folderName = `C:\/Invoices\/${sStartDate.substring(4, 6)}${sStartDate.substring(0, 4)}${sSegment}\/Triplicates`;

        try {
          if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, { recursive: true });
          }
        } catch (err) {
          console.error(err);
          reject(err);
        }

        sData.invoiceType = "TRIPLICATE FOR SUPPLIER";

        let options = {
          displayHeaderFooter: false,
          format: "A4",
          margin: { top: "30px", bottom: "30px", left: "30px", right: "30px" },
          path: `${folderName}/${sData.DocumentNumber}.PDF`
        };
        let sPDF = pdfMaster.generatePdf("template.hbs", sData, options);
        updateFolderLocation(sData.DocumentNumber, `${folderName}/${sData.DocumentNumber}.PDF`, "T");
        resolve(sPDF);
        
      });
    }

    async function updateFolderLocation(DocumentNumber, folderName, sType){
      let sqlquery;
      if(sType == "O"){
        sqlquery = `UPDATE invoice_generation_table SET InvoicePdfStatus = 'X', InvoicePdfLocation = '${folderName}' WHERE DocumentNumber = '${DocumentNumber}';`;
      }else if(sType == "D"){
        sqlquery = `UPDATE invoice_generation_table SET InvoicePdfDuplicateStatus = 'X', InvoicePdfDuplicateLocation = '${folderName}' WHERE DocumentNumber = '${DocumentNumber}';`;
      }else{
        sqlquery = `UPDATE invoice_generation_table SET InvoicePdfTriplicateStatus = 'X', InvoicePdfTriplicateLocation = '${folderName}' WHERE DocumentNumber = '${DocumentNumber}';`;       
      }
      
    
        return new Promise((resolve, reject) => {
          connection.query(sqlquery, (err, result) => {
            if (err) {
              reject(err);
            }
            //console.log(result);
            resolve(result);
          });
        });
    } 

    async function updateInvoiceMonthlyStatus(sDate, sSegment){
      let sqlquery = `UPDATE invoice_monthly_status SET Invoice_PDF_Generation_Flag = 'X' WHERE Month_Year = ${sDate.substring(0, 4)}${sDate.substring(4, 6)} and Segment = ${sSegment};`;
    
        return new Promise((resolve, reject) => {
          connection.query(sqlquery, (err, result) => {
            if (err) {
              reject(err);
            }
            //console.log(result);
            resolve(result);
          });
        });     
    }

  app.post('/generatePDF/:startDate/:endDate/:segment', async (req, res) => {
    try{
      getData(req.params.startDate, req.params.endDate, req.params.segment).then(async (data) => {
        for(var i = 0; i< data.length; i++){
          //console.log(data[i])
          await finalpdfGenerationOriginals(data[i], req.params.startDate, req.params.endDate, req.params.segment);
          await finalpdfGenerationDuplicates(data[i], req.params.startDate, req.params.endDate, req.params.segment);
          await finalpdfGenerationTriplicates(data[i], req.params.startDate, req.params.endDate, req.params.segment);
        }
          await updateInvoiceMonthlyStatus(req.params.startDate, req.params.segment);
        
        //res.contentType("application/pdf");
        res.status(200).send({
          messageCode: "S",
          messageString: "PDF Generated for all Invoices"
        });
        //res.status(200).send("Invoice PDF Generated");
      });
    }catch(err){
      res.status(400).send({
        messageCode: "E",
        messageString: JSON.stringify(err)
      });
    }
  });

  var server = app.listen(PORT, () => {
    console.log(`Application listening on port ${PORT}!`);
    connection.connect((err) => {
      if (!err) {
        console.log("DB Connected successfully");
      } else {
        console.log(err);
      }
    });
  });

  server.timeout = 12000000;
