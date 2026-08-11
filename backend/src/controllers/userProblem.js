const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");

const createProblem = async (req,res)=>{
   
  // API request to authenticate user:
    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;


    try{
        if (req.result.role === 'host' || req.result.role === 'starhost') {
            const problemCount = await Problem.countDocuments({ problemCreator: req.result._id });
            if (req.result.role === 'host' && problemCount >= 7) {
                return res.status(403).send("Host limit reached: Cannot create more than 7 problems.");
            }
            if (req.result.role === 'starhost' && problemCount >= 20) {
                return res.status(403).send("Starhost limit reached: Cannot create more than 20 problems.");
            }
        }
       
       try {
         for(const {language,completeCode} of referenceSolution){
           const languageId = getLanguageById(language);
           const submissions = visibleTestCases.map((testcase)=>({
               source_code: Buffer.from(completeCode).toString('base64'),
               language_id: languageId,
               stdin: Buffer.from(testcase.input).toString('base64'),
               expected_output: Buffer.from(testcase.output).toString('base64')
           }));

           const submitResult = await submitBatch(submissions, true);
           const resultToken = submitResult.map((value)=> value.token);
           const testResult = await submitToken(resultToken, true);

           for(const test of testResult){
            if(test.status_id!=3){
             let errMsg = `Reference solution failed a test case in ${language} (Status: ${test.status_id}).`;
             if (test.compile_output) {
                 errMsg += `\nCompile Error: ${Buffer.from(test.compile_output, 'base64').toString('utf8')}`;
             } else if (test.stderr) {
                 errMsg += `\nError: ${Buffer.from(test.stderr, 'base64').toString('utf8')}`;
             }
             return res.status(400).send(errMsg);
            }
           }
         }
       } catch (judgeError) {
         console.warn("Judge0 validation skipped due to API error:", judgeError.message);
       }


      // We can store it in our DB

    const userProblem =  await Problem.create({
        ...req.body,
        problemCreator: req.result._id
      });

      res.status(201).send("Problem Saved Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{

     if(!id){
      return res.status(400).send("Missing ID Field");
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).send("ID is not persent in server");
    }
      
    try {
      for(const {language,completeCode} of referenceSolution){
        const languageId = getLanguageById(language);
        const submissions = visibleTestCases.map((testcase)=>({
            source_code: Buffer.from(completeCode).toString('base64'),
            language_id: languageId,
            stdin: Buffer.from(testcase.input).toString('base64'),
            expected_output: Buffer.from(testcase.output).toString('base64')
        }));

        const submitResult = await submitBatch(submissions, true);
        const resultToken = submitResult.map((value)=> value.token);
        const testResult = await submitToken(resultToken, true);

        for(const test of testResult){
         if(test.status_id!=3){
             let errMsg = `Reference solution failed a test case in ${language} (Status: ${test.status_id}).`;
             if (test.compile_output) {
                 errMsg += `\nCompile Error: ${Buffer.from(test.compile_output, 'base64').toString('utf8')}`;
             } else if (test.stderr) {
                 errMsg += `\nError: ${Buffer.from(test.stderr, 'base64').toString('utf8')}`;
             }
             return res.status(400).send(errMsg);
         }
        }
      }
    } catch (judgeError) {
      console.warn("Judge0 validation skipped due to API error:", judgeError.message);
    }


  const newProblem = await Problem.findByIdAndUpdate(id , {...req.body}, {runValidators:true, new:true});
   
  res.status(200).send(newProblem);
  }
  catch(err){
      res.status(500).send("Error: "+err);
  }
}

const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}


const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases hiddenTestCases startCode referenceSolution videoLink');
   
   if(!getProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('_id title difficulty tags videoLink');

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}


const solvedAllProblembyUser =  async(req,res)=>{
   
    try{
       
      const userId = req.result._id;

      const user =  await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
      });
      
      res.status(200).send(user.problemSolved);

    }
    catch(err){
      res.status(500).send("Server Error");
    }
}

const submittedProblem = async(req,res)=>{

  try{
     
    const userId = req.result._id;
    const problemId = req.params.pid;

   const ans = await Submission.find({userId,problemId});
   res.status(200).send(ans);

  }
  catch(err){
     res.status(500).send("Internal Server Error");
  }
}



module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem};


